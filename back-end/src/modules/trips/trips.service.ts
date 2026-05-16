import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Trip, TripStatus } from './entities/trip.entity';
import { CreateTripDto } from './dtos/create-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
  ) {}

  async create(createTripDto: CreateTripDto, conductorId: string): Promise<Trip> {
    const trip = this.tripsRepository.create({
      ...createTripDto,
      conductorId,
      estado: TripStatus.ABIERTO,
    });
    return this.tripsRepository.save(trip);
  }

  async findAll(filters: { zona?: string; fecha?: string; estado?: TripStatus }): Promise<Trip[]> {
    const query = this.tripsRepository.createQueryBuilder('trip')
      .leftJoinAndSelect('trip.conductor', 'conductor');

    if (filters.estado) {
      query.andWhere('trip.estado = :estado', { estado: filters.estado });
    }

    if (filters.zona) {
      query.andWhere(
        '(trip.origen_zona ILIKE :zona OR trip.destino_zona ILIKE :zona)',
        { zona: `%${filters.zona}%` },
      );
    }

    if (filters.fecha) {
      query.andWhere('trip.fecha_hora::date = :fecha', { fecha: filters.fecha });
    }

    // Ordenar por fecha más cercana
    query.orderBy('trip.fecha_hora', 'ASC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['conductor', 'requests', 'requests.pasajero'],
    });
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }
    return trip;
  }

  async update(id: string, updateTripDto: Partial<CreateTripDto>, conductorId: string): Promise<Trip> {
    const trip = await this.findOne(id);
    if (trip.conductorId !== conductorId) {
      throw new BadRequestException('Solo el conductor puede editar el viaje');
    }
    if (trip.estado !== TripStatus.ABIERTO) {
      throw new BadRequestException('No se puede editar un viaje que ya no está abierto');
    }
    Object.assign(trip, updateTripDto);
    return this.tripsRepository.save(trip);
  }

  async remove(id: string, conductorId: string): Promise<void> {
    const trip = await this.findOne(id);
    if (trip.conductorId !== conductorId) {
      throw new BadRequestException('Solo el conductor puede eliminar el viaje');
    }
    if (trip.estado !== TripStatus.ABIERTO && trip.estado !== TripStatus.COMPLETO) {
      throw new BadRequestException('No se puede eliminar un viaje en curso o finalizado');
    }
    await this.tripsRepository.remove(trip);
  }

  async startTrip(tripId: string, conductorId: string): Promise<Trip> {
    const trip = await this.findOne(tripId);
    if (trip.conductorId !== conductorId) {
      throw new BadRequestException('Solo el conductor puede iniciar el viaje');
    }
    if (trip.estado !== TripStatus.ABIERTO && trip.estado !== TripStatus.COMPLETO) {
      throw new BadRequestException('El viaje no se puede iniciar en su estado actual');
    }

    trip.estado = TripStatus.EN_CURSO;
    return this.tripsRepository.save(trip);
  }

  async completeTrip(tripId: string, conductorId: string): Promise<Trip> {
    const trip = await this.findOne(tripId);
    if (trip.conductorId !== conductorId) {
      throw new BadRequestException('Solo el conductor puede finalizar el viaje');
    }
    if (trip.estado !== TripStatus.EN_CURSO) {
      throw new BadRequestException('Solo se pueden finalizar viajes que estén en curso');
    }

    trip.estado = TripStatus.FINALIZADO;
    return this.tripsRepository.save(trip);
  }
}
