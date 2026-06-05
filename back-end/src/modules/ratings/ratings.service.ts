import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { Trip, TripStatus } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Request, RequestStatus } from '../requests/entities/request.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
  ) {}

  async findAll(): Promise<Rating[]> {
    return this.ratingsRepository.find({
      relations: ['viaje', 'calificador', 'calificado'],
      order: { created_at: 'DESC' },
    });
  }

  async create(createRatingDto: CreateRatingDto, calificadorId: string): Promise<Rating> {
    const { viajeId, calificadoId, puntuacion } = createRatingDto;

    // 1. Validar existencia del viaje y estado finalizado
    const trip = await this.tripsRepository.findOne({ where: { id: viajeId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (trip.estado !== TripStatus.FINALIZADO) {
      throw new BadRequestException('Solo se puede calificar viajes finalizados');
    }

    // 2. Validar que no se califique a sí mismo
    if (calificadorId === calificadoId) {
      throw new BadRequestException('No puedes calificarte a ti mismo');
    }

    // 3. Validar participación
    await this.validateParticipation(trip, calificadorId, calificadoId);

    // 4. Verificar si ya calificó en este viaje a esta persona
    const existing = await this.ratingsRepository.findOne({
      where: { viajeId, calificadorId, calificadoId },
    });
    if (existing) throw new BadRequestException('Ya has calificado a este usuario para este viaje');

    // 5. Crear calificación
    const rating = this.ratingsRepository.create({
      ...createRatingDto,
      calificadorId,
    });
    const savedRating = await this.ratingsRepository.save(rating);

    // 6. Actualizar reputación del calificado
    await this.updateUserReputation(calificadoId);

    return savedRating;
  }

  private async validateParticipation(trip: Trip, calificadorId: string, calificadoId: string) {
    const participants = new Set<string>();
    participants.add(trip.conductorId);

    const acceptedRequests = await this.requestsRepository.find({
      where: { viajeId: trip.id, estado: RequestStatus.ACEPTADA },
    });
    acceptedRequests.forEach(req => participants.add(req.pasajeroId));

    if (!participants.has(calificadorId) || !participants.has(calificadoId)) {
      throw new BadRequestException('Ambos usuarios deben haber participado en el viaje');
    }
  }

  private async updateUserReputation(userId: string) {
    const ratings = await this.ratingsRepository.find({ where: { calificadoId: userId } });
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((acc, curr) => acc + curr.puntuacion, 0);
    const average = totalRatings > 0 ? sumRatings / totalRatings : 0;

    await this.usersRepository.update(userId, {
      reputacion_promedio: parseFloat(average.toFixed(1)),
      total_viajes: totalRatings // En este contexto, total de calificaciones recibidas
    });
  }
}
