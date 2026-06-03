import { Test, TestingModule } from '@nestjs/testing';
import { RequestsGateway } from './requests.gateway';
import { RequestsService } from './requests.service';
import { RequestStatus } from './entities/request.entity';
import {JwtService} from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {WsJwtGuard } from "../auth/ws-jwt.guard";

describe('RequestsGateway', () => {
  let gateway: RequestsGateway;

  const mockRequestsService = {
    createRequest: jest.fn(),
    updateStatus: jest.fn(),
    cancelRequest: jest.fn(),
  };

  const mockEmit = jest.fn();
  const mockTo = jest.fn(() => ({
    emit: mockEmit,
  }));

  const createSocket = (userId = 'user-1') =>
    ({
      handshake: {
        query: { userId },
      },
      join: jest.fn(),
      leave: jest.fn(),
      user: {
        userId,
      },
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsGateway,
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn('test-secret'),
          },
        },
        {
          provide: WsJwtGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    gateway = module.get<RequestsGateway>(RequestsGateway);

    gateway.server = {
      to: mockTo,
    } as any;

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(gateway).toBeDefined();
  });

  it('debería unir usuario a sala privada al conectar', () => {
    const client = createSocket('user-1');

    gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('user_user-1');
  });

  it('no debería unir usuario a sala si no viene userId', () => {
    const client = {
      handshake: {
        query: {},
      },
      join: jest.fn(),
    } as any;

    gateway.handleConnection(client);

    expect(client.join).not.toHaveBeenCalled();
  });

  it('debería unirse a sala de viaje', () => {
    const client = createSocket();

    const result = gateway.handleJoinTrip(
      {
        tripId: 'trip-1',
      },
      client,
    );

    expect(client.join).toHaveBeenCalledWith('trip_trip-1');
    expect(result).toEqual({
      joined: 'trip-1',
    });
  });

  it('debería salir de sala de viaje', () => {
    const client = createSocket();

    const result = gateway.handleLeaveTrip(
      {
        tripId: 'trip-1',
      },
      client,
    );

    expect(client.leave).toHaveBeenCalledWith('trip_trip-1');
    expect(result).toEqual({
      left: 'trip-1',
    });
  });

  it('debería emitir ubicación actualizada del viaje', () => {
    const client = createSocket();

    gateway.handleUpdateLocation(
      {
        tripId: 'trip-1',
        lat: -1.249,
        lng: -78.616,
      },
      client,
    );

    expect(mockTo).toHaveBeenCalledWith('trip_trip-1');
    expect(mockEmit).toHaveBeenCalledWith(
      'trip_location_updated',
      expect.objectContaining({
        tripId: 'trip-1',
        lat: -1.249,
        lng: -78.616,
        timestamp: expect.any(String),
      }),
    );
  });

  it('debería crear solicitud por WebSocket y notificar al conductor', async () => {
    const client = createSocket('passenger-1');

    mockRequestsService.createRequest.mockResolvedValue({
      id: 'req-1',
      viaje: {
        conductorId: 'driver-1',
      },
    });

    const result = await gateway.handleSendRequest(
      {
        tripId: 'trip-1',
      },
      client,
    );

    expect(mockRequestsService.createRequest).toHaveBeenCalledWith(
      'trip-1',
      'passenger-1',
    );

    expect(mockTo).toHaveBeenCalledWith('user_driver-1');
    expect(mockEmit).toHaveBeenCalledWith(
      'new_request',
      expect.objectContaining({
        requestId: 'req-1',
        passengerId: 'passenger-1',
        tripId: 'trip-1',
      }),
    );

    expect(result).toEqual({
      status: 'pending',
      requestId: 'req-1',
    });
  });

  it('debería gestionar solicitud y notificar al pasajero', async () => {
    const client = createSocket('driver-1');

    mockRequestsService.updateStatus.mockResolvedValue({
      id: 'req-1',
      pasajeroId: 'passenger-1',
      estado: RequestStatus.ACEPTADA,
    });

    const result = await gateway.handleManageRequest(
      {
        requestId: 'req-1',
        status: RequestStatus.ACEPTADA,
      },
      client,
    );

    expect(mockRequestsService.updateStatus).toHaveBeenCalledWith(
      'req-1',
      'driver-1',
      RequestStatus.ACEPTADA,
    );

    expect(mockTo).toHaveBeenCalledWith('user_passenger-1');
    expect(mockEmit).toHaveBeenCalledWith(
      'request_updated',
      expect.objectContaining({
        requestId: 'req-1',
        status: RequestStatus.ACEPTADA,
      }),
    );

    expect(result).toEqual({
      status: RequestStatus.ACEPTADA,
    });
  });

  it('debería cancelar solicitud cuando cancela el pasajero y notificar al conductor', async () => {
    const client = createSocket('passenger-1');

    mockRequestsService.cancelRequest.mockResolvedValue({
      id: 'req-1',
      pasajeroId: 'passenger-1',
      viaje: {
        conductorId: 'driver-1',
      },
    });

    const result = await gateway.handleCancelRequest(
      {
        requestId: 'req-1',
        reason: 'No puedo viajar',
      },
      client,
    );

    expect(mockRequestsService.cancelRequest).toHaveBeenCalledWith(
      'req-1',
      'passenger-1',
      'No puedo viajar',
    );

    expect(mockTo).toHaveBeenCalledWith('user_driver-1');
    expect(mockEmit).toHaveBeenCalledWith(
      'request_cancelled',
      expect.objectContaining({
        requestId: 'req-1',
        reason: 'No puedo viajar',
        cancelledBy: 'passenger-1',
      }),
    );

    expect(result).toEqual({
      status: 'cancelada',
    });
  });

  it('debería cancelar solicitud cuando cancela el conductor y notificar al pasajero', async () => {
    const client = createSocket('driver-1');

    mockRequestsService.cancelRequest.mockResolvedValue({
      id: 'req-1',
      pasajeroId: 'passenger-1',
      viaje: {
        conductorId: 'driver-1',
      },
    });

    const result = await gateway.handleCancelRequest(
      {
        requestId: 'req-1',
        reason: 'No puedo conducir',
      },
      client,
    );

    expect(mockRequestsService.cancelRequest).toHaveBeenCalledWith(
      'req-1',
      'driver-1',
      'No puedo conducir',
    );

    expect(mockTo).toHaveBeenCalledWith('user_passenger-1');
    expect(mockEmit).toHaveBeenCalledWith(
      'request_cancelled',
      expect.objectContaining({
        requestId: 'req-1',
        reason: 'No puedo conducir',
        cancelledBy: 'driver-1',
      }),
    );

    expect(result).toEqual({
      status: 'cancelada',
    });
  });

  it('debería notificar un reporte al usuario afectado', () => {
    gateway.notifyReport('reported-1', 'Mal comportamiento');

    expect(mockTo).toHaveBeenCalledWith('user_reported-1');
    expect(mockEmit).toHaveBeenCalledWith(
      'new_report_notification',
      expect.objectContaining({
        message:
          'Has recibido un nuevo reporte. Tu reputación ha sido afectada.',
        reason: 'Mal comportamiento',
        timestamp: expect.any(String),
      }),
    );
  });
});
