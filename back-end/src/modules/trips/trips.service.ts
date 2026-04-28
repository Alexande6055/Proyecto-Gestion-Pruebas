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

  async findAll(filters: { zona?: string; fecha?: string }): Promise<Trip[]> {
    const query = this.tripsRepository.createQueryBuilder('trip')
      .leftJoinAndSelect('trip.conductor', 'conductor')
      .where('trip.estado = :estado', { estado: TripStatus.ABIERTO })
      .andWhere('trip.cupos_disponibles > 0');

    if (filters.zona) {
      query.andWhere(
        '(trip.origen_zona ILIKE :zona OR trip.destino_zona ILIKE :zona)',
        { zona: `%${filters.zona}%` },
      );
    }

    if (filters.fecha) {
      query.andWhere('trip.fecha_hora::date = :fecha', { fecha: filters.fecha });
    } else {
      query.andWhere('trip.fecha_hora > :now', { now: new Date() });
    }

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

  async completeTrip(tripId: string, conductorId: string): Promise<Trip> {
    const trip = await this.findOne(tripId);
    if (trip.conductorId !== conductorId) {
      throw new BadRequestException('Solo el conductor puede finalizar el viaje');
    }
    if (trip.estado !== TripStatus.ABIERTO && trip.estado !== TripStatus.COMPLETO) {
      throw new BadRequestException('El viaje no se puede finalizar en su estado actual');
    }

    trip.estado = TripStatus.FINALIZADO;
    return this.tripsRepository.save(trip);
  }
}
