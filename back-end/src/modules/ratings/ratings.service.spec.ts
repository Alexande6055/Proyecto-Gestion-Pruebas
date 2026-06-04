import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { RatingsService } from './ratings.service';
import { Rating } from './entities/rating.entity';
import { Trip, TripStatus } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Request, RequestStatus } from '../requests/entities/request.entity';
import { CreateRatingDto } from './dtos/create-rating.dto';

describe('RatingsService', () => {
  let service: RatingsService;

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
  const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440003';

  const mockRatingsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTripsRepository = {
    findOne: jest.fn(),
  };

  const mockUsersRepository = {
    update: jest.fn(),
  };

  const mockRequestsRepository = {
    find: jest.fn(),
  };

  const finalizedTrip = {
    id: VALID_TRIP_ID,
    conductorId: DRIVER_ID,
    estado: TripStatus.FINALIZADO,
  } as Trip;

  const createRatingDto: CreateRatingDto = {
    viajeId: VALID_TRIP_ID,
    calificadoId: PASSENGER_ID,
    puntuacion: 5,
    comentario: 'Excelente pasajero',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getRepositoryToken(Rating),
          useValue: mockRatingsRepository,
        },
        {
          provide: getRepositoryToken(Trip),
          useValue: mockTripsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Request),
          useValue: mockRequestsRepository,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería listar todas las calificaciones', async () => {
    const ratings = [
      {
        id: 'rating-1',
        viajeId: VALID_TRIP_ID,
        calificadorId: DRIVER_ID,
        calificadoId: PASSENGER_ID,
        puntuacion: 5,
        comentario: 'Excelente pasajero',
      },
    ];

    mockRatingsRepository.find.mockResolvedValue(ratings);

    const result = await service.findAll();

    expect(result).toEqual(ratings);
    expect(mockRatingsRepository.find).toHaveBeenCalledWith({
      relations: ['viaje', 'calificador', 'calificado'],
      order: { created_at: 'DESC' },
    });
  });

  it('debería crear una calificación correctamente y actualizar reputación', async () => {
    const rating = {
      id: 'rating-1',
      ...createRatingDto,
      calificadorId: DRIVER_ID,
    };

    mockTripsRepository.findOne.mockResolvedValue(finalizedTrip);

    mockRequestsRepository.find.mockResolvedValue([
      {
        viajeId: VALID_TRIP_ID,
        pasajeroId: PASSENGER_ID,
        estado: RequestStatus.ACEPTADA,
      },
    ]);

    mockRatingsRepository.findOne.mockResolvedValue(null);
    mockRatingsRepository.create.mockReturnValue(rating);
    mockRatingsRepository.save.mockResolvedValue(rating);

    mockRatingsRepository.find.mockResolvedValue([
      {
        puntuacion: 5,
      },
    ]);

    mockUsersRepository.update.mockResolvedValue({ affected: 1 });

    const result = await service.create(createRatingDto, DRIVER_ID);

    expect(result).toEqual(rating);

    expect(mockTripsRepository.findOne).toHaveBeenCalledWith({
      where: { id: VALID_TRIP_ID },
    });

    expect(mockRequestsRepository.find).toHaveBeenCalledWith({
      where: {
        viajeId: VALID_TRIP_ID,
        estado: RequestStatus.ACEPTADA,
      },
    });

    expect(mockRatingsRepository.findOne).toHaveBeenCalledWith({
      where: {
        viajeId: VALID_TRIP_ID,
        calificadorId: DRIVER_ID,
        calificadoId: PASSENGER_ID,
      },
    });

    expect(mockRatingsRepository.create).toHaveBeenCalledWith({
      ...createRatingDto,
      calificadorId: DRIVER_ID,
    });

    expect(mockRatingsRepository.save).toHaveBeenCalledWith(rating);

    expect(mockUsersRepository.update).toHaveBeenCalledWith(PASSENGER_ID, {
      reputacion_promedio: 5,
      total_viajes: 1,
    });
  });

  it('debería lanzar NotFoundException si el viaje no existe', async () => {
    mockTripsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(createRatingDto, DRIVER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería rechazar si el viaje no está finalizado', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...finalizedTrip,
      estado: TripStatus.ABIERTO,
    });

    await expect(
      service.create(createRatingDto, DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si el usuario intenta calificarse a sí mismo', async () => {
    mockTripsRepository.findOne.mockResolvedValue(finalizedTrip);

    await expect(
      service.create(
        {
          ...createRatingDto,
          calificadoId: DRIVER_ID,
        },
        DRIVER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si el calificador no participó en el viaje', async () => {
    mockTripsRepository.findOne.mockResolvedValue(finalizedTrip);

    mockRequestsRepository.find.mockResolvedValue([
      {
        viajeId: VALID_TRIP_ID,
        pasajeroId: PASSENGER_ID,
        estado: RequestStatus.ACEPTADA,
      },
    ]);

    await expect(
      service.create(createRatingDto, OTHER_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si el calificado no participó en el viaje', async () => {
    mockTripsRepository.findOne.mockResolvedValue(finalizedTrip);

    mockRequestsRepository.find.mockResolvedValue([]);

    await expect(
      service.create(
        {
          ...createRatingDto,
          calificadoId: OTHER_USER_ID,
        },
        DRIVER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si ya existe una calificación previa', async () => {
    mockTripsRepository.findOne.mockResolvedValue(finalizedTrip);

    mockRequestsRepository.find.mockResolvedValue([
      {
        viajeId: VALID_TRIP_ID,
        pasajeroId: PASSENGER_ID,
        estado: RequestStatus.ACEPTADA,
      },
    ]);

    mockRatingsRepository.findOne.mockResolvedValue({
      id: 'rating-existente',
      viajeId: VALID_TRIP_ID,
      calificadorId: DRIVER_ID,
      calificadoId: PASSENGER_ID,
    });

    await expect(
      service.create(createRatingDto, DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería actualizar reputación con promedio de calificaciones', async () => {
    const rating = {
      id: 'rating-1',
      ...createRatingDto,
      calificadorId: DRIVER_ID,
    };

    mockTripsRepository.findOne.mockResolvedValue(finalizedTrip);

    mockRequestsRepository.find.mockResolvedValue([
      {
        viajeId: VALID_TRIP_ID,
        pasajeroId: PASSENGER_ID,
        estado: RequestStatus.ACEPTADA,
      },
    ]);

    mockRatingsRepository.findOne.mockResolvedValue(null);
    mockRatingsRepository.create.mockReturnValue(rating);
    mockRatingsRepository.save.mockResolvedValue(rating);

    mockRatingsRepository.find.mockResolvedValue([
      {
        puntuacion: 4,
      },
      {
        puntuacion: 5,
      },
    ]);

    mockUsersRepository.update.mockResolvedValue({ affected: 1 });

    const result = await service.create(createRatingDto, DRIVER_ID);

    expect(result).toEqual(rating);
    expect(mockUsersRepository.update).toHaveBeenCalledWith(PASSENGER_ID, {
      reputacion_promedio: 4.5,
      total_viajes: 2,
    });
  });
});
