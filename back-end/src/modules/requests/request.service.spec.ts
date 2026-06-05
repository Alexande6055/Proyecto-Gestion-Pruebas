import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { RequestsService } from './requests.service';
import { Request, RequestStatus } from './entities/request.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';

describe('RequestsService', () => {
  let service: RequestsService;

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const VALID_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440002';
  const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440003';

  const mockRequestRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTripRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const openTrip = {
    id: VALID_TRIP_ID,
    conductorId: VALID_DRIVER_ID,
    cuposDisponibles: 2,
    estado: 'abierto',
    fechaHoraSalida: new Date(Date.now() + 60 * 60 * 1000),
  };

  const passenger = {
    id: VALID_PASSENGER_ID,
    reputacion_promedio: 4.5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: mockRequestRepository,
        },
        {
          provide: getRepositoryToken(Trip),
          useValue: mockTripRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería listar solicitudes', async () => {
    const requests = [{ id: 'req-1' }];

    mockRequestRepository.find.mockResolvedValue(requests);

    const result = await service.findAll();

    expect(result).toEqual(requests);
    expect(mockRequestRepository.find).toHaveBeenCalled();
  });

  it('debería crear solicitud correctamente', async () => {
    const createdRequest = {
      id: 'req-1',
      viajeId: VALID_TRIP_ID,
      pasajeroId: VALID_PASSENGER_ID,
      estado: RequestStatus.PENDIENTE,
      viaje: openTrip,
    };

    mockTripRepository.findOne.mockResolvedValue(openTrip);
    mockUserRepository.findOne.mockResolvedValue(passenger);
    mockRequestRepository.findOne.mockResolvedValue(null);
    mockRequestRepository.create.mockReturnValue(createdRequest);
    mockRequestRepository.save.mockResolvedValue(createdRequest);

    const result = await service.createRequest(
      VALID_TRIP_ID,
      VALID_PASSENGER_ID,
    );

    expect(result).toEqual(createdRequest);
    expect(mockRequestRepository.create).toHaveBeenCalledWith({
      viajeId: VALID_TRIP_ID,
      pasajeroId: VALID_PASSENGER_ID,
      estado: RequestStatus.PENDIENTE,
    });
    expect(mockRequestRepository.save).toHaveBeenCalledWith(createdRequest);
  });

  it('debería rechazar tripId vacío al crear solicitud', async () => {
    await expect(service.createRequest('', VALID_PASSENGER_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debería rechazar passengerId vacío al crear solicitud', async () => {
    await expect(service.createRequest(VALID_TRIP_ID, '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debería lanzar NotFoundException si el viaje no existe', async () => {
    mockTripRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createRequest(VALID_TRIP_ID, VALID_PASSENGER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar NotFoundException si el pasajero no existe', async () => {
    mockTripRepository.findOne.mockResolvedValue(openTrip);
    mockUserRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createRequest(VALID_TRIP_ID, VALID_PASSENGER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar pasajero con reputación menor a 3', async () => {
    mockTripRepository.findOne.mockResolvedValue(openTrip);
    mockUserRepository.findOne.mockResolvedValue({
      id: VALID_PASSENGER_ID,
      reputacion_promedio: 2.5,
    });

    await expect(
      service.createRequest(VALID_TRIP_ID, VALID_PASSENGER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si el conductor solicita su propio viaje', async () => {
    mockTripRepository.findOne.mockResolvedValue(openTrip);
    mockUserRepository.findOne.mockResolvedValue({
      id: VALID_DRIVER_ID,
      reputacion_promedio: 5,
    });

    await expect(
      service.createRequest(VALID_TRIP_ID, VALID_DRIVER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si no hay cupos disponibles', async () => {
    const tripSinCupos = {
      ...openTrip,
      cuposDisponibles: 0,
      cupos_disponibles: 0,
      seatsAvailable: 0,
    };

    mockTripRepository.findOne.mockResolvedValue(tripSinCupos);
    mockUserRepository.findOne.mockResolvedValue(passenger);
    mockRequestRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createRequest(VALID_TRIP_ID, VALID_PASSENGER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería permitir crear solicitud aunque el viaje tenga fecha pasada si el servicio no valida fecha', async () => {
    const fechaPasada = new Date(Date.now() - 60 * 60 * 1000);

    const tripPasado = {
      ...openTrip,
      fechaHoraSalida: fechaPasada,
    };

    const createdRequest = {
      id: 'req-1',
      viajeId: VALID_TRIP_ID,
      pasajeroId: VALID_PASSENGER_ID,
      estado: RequestStatus.PENDIENTE,
      viaje: tripPasado,
    };

    mockTripRepository.findOne.mockResolvedValue(tripPasado);
    mockUserRepository.findOne.mockResolvedValue(passenger);
    mockRequestRepository.findOne.mockResolvedValue(null);
    mockRequestRepository.create.mockReturnValue(createdRequest);
    mockRequestRepository.save.mockResolvedValue(createdRequest);

    const result = await service.createRequest(
      VALID_TRIP_ID,
      VALID_PASSENGER_ID,
    );

    expect(result).toEqual(createdRequest);
    expect(mockRequestRepository.save).toHaveBeenCalledWith(createdRequest);
  });

  it('debería aceptar solicitud correctamente', async () => {
    const request = {
      id: 'req-1',
      estado: RequestStatus.PENDIENTE,
      pasajeroId: VALID_PASSENGER_ID,
      viaje: {
        ...openTrip,
        cuposDisponibles: 2,
      },
    };

    mockRequestRepository.findOne.mockResolvedValue(request);
    mockUserRepository.findOne.mockResolvedValue(passenger);
    mockRequestRepository.save.mockResolvedValue({
      ...request,
      estado: RequestStatus.ACEPTADA,
    });
    mockTripRepository.save.mockResolvedValue({
      ...request.viaje,
      cuposDisponibles: 1,
    });

    const result = await service.updateStatus(
      'req-1',
      VALID_DRIVER_ID,
      RequestStatus.ACEPTADA,
    );

    expect(result.estado).toBe(RequestStatus.ACEPTADA);
    expect(mockTripRepository.save).toHaveBeenCalled();
    expect(mockRequestRepository.save).toHaveBeenCalled();
  });

  it('debería rechazar solicitud correctamente', async () => {
    const request = {
      id: 'req-1',
      estado: RequestStatus.PENDIENTE,
      pasajeroId: VALID_PASSENGER_ID,
      viaje: openTrip,
    };

    mockRequestRepository.findOne.mockResolvedValue(request);
    mockUserRepository.findOne.mockResolvedValue(passenger);
    mockRequestRepository.save.mockResolvedValue({
      ...request,
      estado: RequestStatus.RECHAZADA,
    });

    const result = await service.updateStatus(
      'req-1',
      VALID_DRIVER_ID,
      RequestStatus.RECHAZADA,
    );

    expect(result.estado).toBe(RequestStatus.RECHAZADA);
    expect(mockRequestRepository.save).toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si solicitud no existe al actualizar estado', async () => {
    mockRequestRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateStatus('req-1', VALID_DRIVER_ID, RequestStatus.ACEPTADA),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería rechazar si conductor no corresponde al viaje', async () => {
    mockRequestRepository.findOne.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.PENDIENTE,
      viaje: openTrip,
    });

    await expect(
      service.updateStatus('req-1', OTHER_USER_ID, RequestStatus.ACEPTADA),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar si solicitud ya fue procesada', async () => {
    mockRequestRepository.findOne.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.ACEPTADA,
      viaje: openTrip,
    });

    await expect(
      service.updateStatus('req-1', VALID_DRIVER_ID, RequestStatus.RECHAZADA),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería cancelar solicitud correctamente', async () => {
    const request = {
      id: 'req-1',
      estado: RequestStatus.PENDIENTE,
      pasajeroId: VALID_PASSENGER_ID,
      viaje: openTrip,
      motivo_cancelacion: null,
    };

    mockRequestRepository.findOne.mockResolvedValue(request);
    mockRequestRepository.save.mockResolvedValue({
      ...request,
      estado: RequestStatus.CANCELADA,
      motivo_cancelacion: 'No puedo viajar',
    });

    const result = await service.cancelRequest(
      'req-1',
      VALID_PASSENGER_ID,
      'No puedo viajar',
    );

    expect(result.estado).toBe(RequestStatus.CANCELADA);
    expect(result.motivo_cancelacion).toBe('No puedo viajar');
    expect(mockRequestRepository.save).toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si solicitud no existe al cancelar', async () => {
    mockRequestRepository.findOne.mockResolvedValue(null);

    await expect(
      service.cancelRequest('req-1', VALID_PASSENGER_ID, 'No puedo viajar'),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería rechazar cancelación sin motivo', async () => {
    mockRequestRepository.findOne.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.PENDIENTE,
      pasajeroId: VALID_PASSENGER_ID,
      viaje: openTrip,
    });

    await expect(
      service.cancelRequest('req-1', VALID_PASSENGER_ID, ''),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar cancelación por usuario sin permiso', async () => {
    mockRequestRepository.findOne.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.PENDIENTE,
      pasajeroId: VALID_PASSENGER_ID,
      viaje: openTrip,
    });

    await expect(
      service.cancelRequest('req-1', OTHER_USER_ID, 'No puedo viajar'),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería rechazar cancelación de solicitud ya cancelada', async () => {
    mockRequestRepository.findOne.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.CANCELADA,
      pasajeroId: VALID_PASSENGER_ID,
      viaje: openTrip,
    });

    await expect(
      service.cancelRequest('req-1', VALID_PASSENGER_ID, 'No puedo viajar'),
    ).rejects.toThrow(BadRequestException);
  });
});
