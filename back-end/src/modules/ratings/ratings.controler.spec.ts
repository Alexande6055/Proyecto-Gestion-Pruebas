import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

describe('RatingsController', () => {
  let controller: RatingsController;

  const mockRatingsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const CALIFICADOR_ID = '550e8400-e29b-41d4-a716-446655440001';
  const CALIFICADO_ID = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
      ],
    }).compile();

    controller = module.get<RatingsController>(RatingsController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería listar calificaciones', async () => {
    const ratings = [
      {
        id: 'rating-1',
        viajeId: VALID_TRIP_ID,
        calificadorId: CALIFICADOR_ID,
        calificadoId: CALIFICADO_ID,
        puntuacion: 5,
        comentario: 'Excelente conductor',
      },
    ];

    mockRatingsService.findAll.mockResolvedValue(ratings);

    const result = await controller.findAll();

    expect(result).toEqual(ratings);
    expect(mockRatingsService.findAll).toHaveBeenCalled();
  });

  it('debería crear una calificación', async () => {
    const dto = {
      viajeId: VALID_TRIP_ID,
      calificadoId: CALIFICADO_ID,
      puntuacion: 5,
      comentario: 'Excelente conductor, muy puntual.',
    };

    const req = {
      user: {
        userId: CALIFICADOR_ID,
      },
    };

    const createdRating = {
      id: 'rating-1',
      ...dto,
      calificadorId: CALIFICADOR_ID,
    };

    mockRatingsService.create.mockResolvedValue(createdRating);

    const result = await controller.create(dto, req);

    expect(result).toEqual(createdRating);
    expect(mockRatingsService.create).toHaveBeenCalledWith(
      dto,
      CALIFICADOR_ID,
    );
  });
});
