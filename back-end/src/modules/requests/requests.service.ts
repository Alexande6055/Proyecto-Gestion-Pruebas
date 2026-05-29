import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Request, RequestStatus } from './entities/request.entity';
import { Trip, TripStatus } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Request[]> {
    return this.requestsRepository.find({
      relations: ['viaje', 'pasajero'],
      order: { fechaSolicitud: 'DESC' },
    });
  }

  async createRequest(tripId: string, passengerId: string): Promise<Request> {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(String(tripId)) || !uuidPattern.test(String(passengerId))) {
      throw new BadRequestException('El viaje o pasajero recibido no es valido');
    }

    const trip = await this.tripsRepository.findOne({ where: { id: tripId } });
    const passenger = await this.usersRepository.findOne({ where: { id: passengerId } });

    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (!passenger) throw new BadRequestException('La sesion del pasajero ya no es valida. Cierra sesion e inicia nuevamente');
    
    if (Number(passenger.reputacion_promedio) < 3.0) {
      throw new BadRequestException('Tu reputación es inferior a 3.0. Estás bloqueado para solicitar viajes.');
    }

    if (trip.conductorId === passengerId) throw new BadRequestException('No puedes solicitar tu propio viaje');
    if (trip.estado !== TripStatus.ABIERTO) throw new BadRequestException('El viaje ya no esta abierto');
    if (trip.cupos_disponibles <= 0) throw new BadRequestException('No hay cupos disponibles');
    if (trip.fecha_hora && new Date(trip.fecha_hora).getTime() < Date.now()) {
      throw new BadRequestException('No puedes reservar un viaje que ya paso');
    }

    const existing = await this.requestsRepository.findOne({
      where: {
        viajeId: tripId,
        pasajeroId: passengerId,
        estado: In([RequestStatus.PENDIENTE, RequestStatus.ACEPTADA]),
      },
    });
    if (existing) throw new BadRequestException('Ya tienes una reserva activa para este viaje');

    const request = this.requestsRepository.create({
      viajeId: tripId,
      pasajeroId: passengerId,
      estado: RequestStatus.PENDIENTE,
    });

    return this.requestsRepository.save(request);
  }

  async updateStatus(requestId: string, conductorId: string, status: RequestStatus): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['viaje'],
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.viaje.conductorId !== conductorId) throw new BadRequestException('No tienes permiso para gestionar esta solicitud');
    if (request.estado !== RequestStatus.PENDIENTE) throw new BadRequestException('La solicitud ya fue procesada');
    if (![RequestStatus.ACEPTADA, RequestStatus.RECHAZADA].includes(status)) {
      throw new BadRequestException('El estado de la solicitud no es valido');
    }
    if (request.viaje.estado !== TripStatus.ABIERTO) {
      throw new BadRequestException('Solo se pueden gestionar reservas de viajes abiertos');
    }
    if (request.viaje.fecha_hora && new Date(request.viaje.fecha_hora).getTime() < Date.now()) {
      throw new BadRequestException('No se puede gestionar una reserva de un viaje pasado');
    }

    if (status === RequestStatus.ACEPTADA) {
      const passenger = await this.usersRepository.findOne({ where: { id: request.pasajeroId } });
      if (passenger && Number(passenger.reputacion_promedio) < 3.0) {
        throw new BadRequestException('El pasajero tiene una reputación inferior a 3.0 y está bloqueado.');
      }

      if (request.viaje.cupos_disponibles <= 0) {
        throw new BadRequestException('Ya no hay cupos en el viaje');
      }

      request.viaje.cupos_disponibles -= 1;
      if (request.viaje.cupos_disponibles === 0) {
        request.viaje.estado = TripStatus.COMPLETO;
      }
      await this.tripsRepository.save(request.viaje);
    }

    request.estado = status;
    return this.requestsRepository.save(request);
  }

  async cancelRequest(requestId: string, userId: string, reason: string): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['viaje'],
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (!reason?.trim()) throw new BadRequestException('Debes indicar el motivo de cancelacion');

    const isPassenger = request.pasajeroId === userId;
    const isConductor = request.viaje.conductorId === userId;

    if (!isPassenger && !isConductor) {
      throw new BadRequestException('No tienes permiso para cancelar esta solicitud');
    }

    if ([RequestStatus.CANCELADA, RequestStatus.RECHAZADA].includes(request.estado)) {
      throw new BadRequestException('La solicitud ya no se puede cancelar');
    }
    if ([TripStatus.EN_CURSO, TripStatus.FINALIZADO].includes(request.viaje.estado)) {
      throw new BadRequestException('No se puede cancelar una reserva de un viaje en curso o finalizado');
    }

    if (request.estado === RequestStatus.ACEPTADA) {
      request.viaje.cupos_disponibles += 1;
      if (request.viaje.estado === TripStatus.COMPLETO) {
        request.viaje.estado = TripStatus.ABIERTO;
      }
      await this.tripsRepository.save(request.viaje);
    }

    request.estado = RequestStatus.CANCELADA;
    request.motivo_cancelacion = reason.trim();

    return this.requestsRepository.save(request);
  }
}
