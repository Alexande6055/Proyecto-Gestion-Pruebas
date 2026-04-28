import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestStatus } from './entities/request.entity';
import { Trip, TripStatus } from '../trips/entities/trip.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
  ) {}

  async createRequest(tripId: string, passengerId: string): Promise<Request> {
    const trip = await this.tripsRepository.findOne({ where: { id: tripId } });

    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.conductorId === passengerId) throw new BadRequestException('No puedes solicitar tu propio viaje');
    if (trip.estado !== TripStatus.ABIERTO) throw new BadRequestException('El viaje ya no está abierto');
    if (trip.cupos_disponibles <= 0) throw new BadRequestException('No hay cupos disponibles');

    // Verificar si ya tiene una solicitud
    const existing = await this.requestsRepository.findOne({
      where: { viajeId: tripId, pasajeroId: passengerId },
    });
    if (existing) throw new BadRequestException('Ya has enviado una solicitud para este viaje');

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

    if (status === RequestStatus.ACEPTADA) {
      if (request.viaje.cupos_disponibles <= 0) {
        throw new BadRequestException('Ya no hay cupos en el viaje');
      }
      // Reducir cupos
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
    
    const isPassenger = request.pasajeroId === userId;
    const isConductor = request.viaje.conductorId === userId;

    if (!isPassenger && !isConductor) {
      throw new BadRequestException('No tienes permiso para cancelar esta solicitud');
    }

    if (request.estado === RequestStatus.CANCELADA) {
      throw new BadRequestException('La solicitud ya está cancelada');
    }

    // Si estaba aceptada, devolvemos el cupo
    if (request.estado === RequestStatus.ACEPTADA) {
      request.viaje.cupos_disponibles += 1;
      if (request.viaje.estado === TripStatus.COMPLETO) {
        request.viaje.estado = TripStatus.ABIERTO;
      }
      await this.tripsRepository.save(request.viaje);
    }

    request.estado = RequestStatus.CANCELADA;
    request.motivo_cancelacion = reason;
    
    return this.requestsRepository.save(request);
  }
}
