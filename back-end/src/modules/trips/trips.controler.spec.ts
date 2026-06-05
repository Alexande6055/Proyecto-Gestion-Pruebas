import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

describe('TripsController', () => {
  let controller: TripsController;

  const mockTripsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    startTrip: jest.fn(),
    completeTrip: jest.fn(),
  };

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

  const req = {
    user: {
      userId: VALID_USER_ID,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
      ],
    }).compile();

    controller = module.get<TripsController>(TripsController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería crear un viaje', async () => {
    const dto = {
      origen_zona: 'Ficoa',
      destino_zona: 'Campus Huachi',
      fecha_hora: '2026-05-01T18:00:00Z',
      cupos_disponibles: 4,
      origen_lat: -1.24908,
      origen_lng: -78.61675,
      destino_lat: -1.26806,
      destino_lng: -78.63222,
      notas_reglas: 'Puntualidad por favor',
    };

    const createdTrip = {
      id: VALID_TRIP_ID,
      ...dto,
      conductorId: VALID_USER_ID,
    };

    mockTripsService.create.mockResolvedValue(createdTrip);

    const result = await controller.create(dto as any, req);

    expect(result).toEqual(createdTrip);
    expect(mockTripsService.create).toHaveBeenCalledWith(dto, VALID_USER_ID);
  });

  it('debería listar viajes con filtros', async () => {
    const trips = [
      {
        id: VALID_TRIP_ID,
        origen: 'UTA',
        destino: 'Ficoa',
      },
    ];

    mockTripsService.findAll.mockResolvedValue(trips);

    const result = await controller.findAll('UTA', '2026-06-03', 'abierto');

    expect(result).toEqual(trips);
    expect(mockTripsService.findAll).toHaveBeenCalledWith({
      zona: 'UTA',
      fecha: '2026-06-03',
      estado: 'abierto',
    });
  });

  it('debería obtener un viaje por id', async () => {
    const trip = {
      id: VALID_TRIP_ID,
      origen: 'UTA',
      destino: 'Ficoa',
    };

    mockTripsService.findOne.mockResolvedValue(trip);

    const result = await controller.findOne(VALID_TRIP_ID);

    expect(result).toEqual(trip);
    expect(mockTripsService.findOne).toHaveBeenCalledWith(VALID_TRIP_ID);
  });

  it('debería actualizar un viaje', async () => {
    const dto = {
      destino: 'Ingahurco',
    };

    const updatedTrip = {
      id: VALID_TRIP_ID,
      destino: 'Ingahurco',
    };

    mockTripsService.update.mockResolvedValue(updatedTrip);

    const result = await controller.update(VALID_TRIP_ID, dto as any, req);

    expect(result).toEqual(updatedTrip);
    expect(mockTripsService.update).toHaveBeenCalledWith(
      VALID_TRIP_ID,
      dto,
      VALID_USER_ID,
    );
  });

  it('debería eliminar un viaje', async () => {
    mockTripsService.remove.mockResolvedValue({
      message: 'Viaje eliminado correctamente',
    });

    const result = await controller.remove(VALID_TRIP_ID, req);

    expect(result).toEqual({
      message: 'Viaje eliminado correctamente',
    });
    expect(mockTripsService.remove).toHaveBeenCalledWith(
      VALID_TRIP_ID,
      VALID_USER_ID,
    );
  });

  it('debería iniciar un viaje', async () => {
    mockTripsService.startTrip.mockResolvedValue({
      id: VALID_TRIP_ID,
      estado: 'en_curso',
    });

    const result = await controller.start(VALID_TRIP_ID, req);

    expect(result).toEqual({
      id: VALID_TRIP_ID,
      estado: 'en_curso',
    });
    expect(mockTripsService.startTrip).toHaveBeenCalledWith(
      VALID_TRIP_ID,
      VALID_USER_ID,
    );
  });

  it('debería finalizar un viaje', async () => {
    mockTripsService.completeTrip.mockResolvedValue({
      id: VALID_TRIP_ID,
      estado: 'finalizado',
    });

    const result = await controller.complete(VALID_TRIP_ID, req);

    expect(result).toEqual({
      id: VALID_TRIP_ID,
      estado: 'finalizado',
    });
    expect(mockTripsService.completeTrip).toHaveBeenCalledWith(
      VALID_TRIP_ID,
      VALID_USER_ID,
    );
  });
});
