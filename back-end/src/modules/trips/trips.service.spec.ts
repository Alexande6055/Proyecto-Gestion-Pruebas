import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TripsService } from './trips.service';
import { Trip, TripStatus } from './entities/trip.entity';
import { Request, RequestStatus } from '../requests/entities/request.entity';
import { User } from '../users/entities/user.entity';

describe('TripsService', () => {
  let service: TripsService;

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';

  const mockTripsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRequestsRepository = {
    update: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
  };

  const createTripDto = {
    origen_zona: 'Ficoa',
    destino_zona: 'Campus Huachi',
    fecha_hora: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    cupos_disponibles: 4,
    origen_lat: -1.24908,
    origen_lng: -78.61675,
    destino_lat: -1.26806,
    destino_lng: -78.63222,
    notas_reglas: 'Puntualidad por favor',
  };

  const baseTrip = {
    id: VALID_TRIP_ID,
    conductorId: VALID_DRIVER_ID,
    origen_zona: 'Ficoa',
    destino_zona: 'Campus Huachi',
    fecha_hora: new Date(Date.now() + 60 * 60 * 1000),
    cupos_disponibles: 4,
    estado: TripStatus.ABIERTO,
    requests: [],
  } as Trip;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getRepositoryToken(Trip),
          useValue: mockTripsRepository,
        },
        {
          provide: getRepositoryToken(Request),
          useValue: mockRequestsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería crear un viaje correctamente', async () => {
    const createdTrip = {
      ...baseTrip,
      ...createTripDto,
      conductorId: VALID_DRIVER_ID,
      estado: TripStatus.ABIERTO,
    };

    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 4.5,
    });

    mockTripsRepository.create.mockReturnValue(createdTrip);
    mockTripsRepository.save.mockResolvedValue(createdTrip);

    const result = await service.create(createTripDto, VALID_DRIVER_ID);

    expect(result).toEqual(createdTrip);
    expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
      where: { id: VALID_DRIVER_ID },
    });
    expect(mockTripsRepository.create).toHaveBeenCalledWith({
      ...createTripDto,
      conductorId: VALID_DRIVER_ID,
      estado: TripStatus.ABIERTO,
    });
    expect(mockTripsRepository.save).toHaveBeenCalledWith(createdTrip);
  });

  it('debería rechazar creación si conductor tiene reputación menor a 3', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 2.5,
    });

    await expect(
      service.create(createTripDto, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar creación con fecha pasada', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 4.5,
    });

    await expect(
      service.create(
        {
          ...createTripDto,
          fecha_hora: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        VALID_DRIVER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería listar viajes con filtros', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([baseTrip]),
    };

    mockTripsRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.findAll({
      zona: 'Ficoa',
      fecha: '2026-06-03',
      estado: TripStatus.ABIERTO,
    });

    expect(result).toEqual([baseTrip]);
    expect(mockTripsRepository.createQueryBuilder).toHaveBeenCalledWith('trip');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'trip.conductor',
      'conductor',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalled();
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('trip.fecha_hora', 'ASC');
    expect(queryBuilder.getMany).toHaveBeenCalled();
  });

  it('debería listar viajes sin filtros', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([baseTrip]),
    };

    mockTripsRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.findAll({});

    expect(result).toEqual([baseTrip]);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.getMany).toHaveBeenCalled();
  });

  it('debería obtener viaje por id', async () => {
    mockTripsRepository.findOne.mockResolvedValue(baseTrip);

    const result = await service.findOne(VALID_TRIP_ID);

    expect(result).toEqual(baseTrip);
    expect(mockTripsRepository.findOne).toHaveBeenCalledWith({
      where: { id: VALID_TRIP_ID },
      relations: ['conductor', 'requests', 'requests.pasajero'],
    });
  });

  it('debería lanzar NotFoundException si el viaje no existe', async () => {
    mockTripsRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(VALID_TRIP_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería actualizar un viaje correctamente', async () => {
    const updateDto = {
      destino_zona: 'Ingahurco',
    };

    const updatedTrip = {
      ...baseTrip,
      ...updateDto,
    };

    mockTripsRepository.findOne.mockResolvedValue(baseTrip);
    mockTripsRepository.save.mockResolvedValue(updatedTrip);

    const result = await service.update(
      VALID_TRIP_ID,
      updateDto,
      VALID_DRIVER_ID,
    );

    expect(result).toEqual(updatedTrip);
    expect(mockTripsRepository.save).toHaveBeenCalledWith(updatedTrip);
  });

  it('debería rechazar actualización si no es conductor', async () => {
    mockTripsRepository.findOne.mockResolvedValue(baseTrip);

    await expect(
      service.update(VALID_TRIP_ID, { destino_zona: 'Centro' }, OTHER_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar actualización si el viaje no está abierto', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.EN_CURSO,
    });

    await expect(
      service.update(
        VALID_TRIP_ID,
        { destino_zona: 'Centro' },
        VALID_DRIVER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar actualización con fecha pasada', async () => {
    mockTripsRepository.findOne.mockResolvedValue(baseTrip);

    await expect(
      service.update(
        VALID_TRIP_ID,
        {
          fecha_hora: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        VALID_DRIVER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería eliminar un viaje correctamente', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.ABIERTO,
      requests: [],
    });

    mockTripsRepository.remove.mockResolvedValue(undefined);

    await service.remove(VALID_TRIP_ID, VALID_DRIVER_ID);

    expect(mockTripsRepository.remove).toHaveBeenCalled();
  });

  it('debería rechazar eliminación si no es conductor', async () => {
    mockTripsRepository.findOne.mockResolvedValue(baseTrip);

    await expect(
      service.remove(VALID_TRIP_ID, OTHER_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar eliminación si el viaje está en curso', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.EN_CURSO,
    });

    await expect(
      service.remove(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar eliminación si tiene reservas aceptadas', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.ABIERTO,
      requests: [
        {
          id: 'req-1',
          estado: RequestStatus.ACEPTADA,
        },
      ],
    });

    await expect(
      service.remove(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería iniciar viaje correctamente', async () => {
    const trip = {
      ...baseTrip,
      estado: TripStatus.ABIERTO,
      requests: [
        {
          id: 'req-1',
          estado: RequestStatus.ACEPTADA,
        },
      ],
    };

    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 4.5,
    });

    mockTripsRepository.findOne.mockResolvedValue(trip);
    mockTripsRepository.save.mockResolvedValue({
      ...trip,
      estado: TripStatus.EN_CURSO,
    });

    const result = await service.startTrip(VALID_TRIP_ID, VALID_DRIVER_ID);

    expect(result.estado).toBe(TripStatus.EN_CURSO);
    expect(mockTripsRepository.save).toHaveBeenCalled();
  });

  it('debería rechazar inicio si conductor tiene reputación menor a 3', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 2.5,
    });

    await expect(
      service.startTrip(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar inicio si no es conductor', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: OTHER_USER_ID,
      reputacion_promedio: 4.5,
    });

    mockTripsRepository.findOne.mockResolvedValue(baseTrip);

    await expect(
      service.startTrip(VALID_TRIP_ID, OTHER_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar inicio si estado no permite iniciar', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 4.5,
    });

    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.FINALIZADO,
    });

    await expect(
      service.startTrip(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar inicio si hay reservas pendientes', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 4.5,
    });

    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.ABIERTO,
      requests: [
        {
          id: 'req-1',
          estado: RequestStatus.PENDIENTE,
        },
      ],
    });

    await expect(
      service.startTrip(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar inicio si no hay reservas aceptadas', async () => {
    mockUsersRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 4.5,
    });

    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.ABIERTO,
      requests: [],
    });

    await expect(
      service.startTrip(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería finalizar viaje correctamente', async () => {
    const trip = {
      ...baseTrip,
      estado: TripStatus.EN_CURSO,
    };

    mockTripsRepository.findOne.mockResolvedValue(trip);
    mockRequestsRepository.update.mockResolvedValue({ affected: 1 });
    mockTripsRepository.save.mockResolvedValue({
      ...trip,
      estado: TripStatus.FINALIZADO,
    });

    const result = await service.completeTrip(VALID_TRIP_ID, VALID_DRIVER_ID);

    expect(result.estado).toBe(TripStatus.FINALIZADO);
    expect(mockRequestsRepository.update).toHaveBeenCalledWith(
      {
        viajeId: VALID_TRIP_ID,
        estado: RequestStatus.PENDIENTE,
      },
      {
        estado: RequestStatus.RECHAZADA,
      },
    );
    expect(mockTripsRepository.save).toHaveBeenCalled();
  });

  it('debería rechazar finalización si no es conductor', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.EN_CURSO,
    });

    await expect(
      service.completeTrip(VALID_TRIP_ID, OTHER_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar finalización si no está en curso', async () => {
    mockTripsRepository.findOne.mockResolvedValue({
      ...baseTrip,
      estado: TripStatus.ABIERTO,
    });

    await expect(
      service.completeTrip(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });
});
