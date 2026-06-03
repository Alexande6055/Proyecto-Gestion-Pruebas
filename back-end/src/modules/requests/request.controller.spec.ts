import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestStatus } from './entities/request.entity';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestsService = {
    findAll: jest.fn(),
    createRequest: jest.fn(),
    updateStatus: jest.fn(),
    cancelRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: mockRequestsService }],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
    jest.clearAllMocks();
  });

  it('debería listar solicitudes', async () => {
    const data = [{ id: 'req-1' }];
    mockRequestsService.findAll.mockResolvedValue(data);

    const result = await controller.findAll();

    expect(result).toEqual(data);
    expect(mockRequestsService.findAll).toHaveBeenCalled();
  });

  it('debería crear solicitud usando viaje_id', async () => {
    const req = { user: { userId: 'user-1' } };
    mockRequestsService.createRequest.mockResolvedValue({ id: 'req-1' });

    const result = await controller.create({ viaje_id: 'trip-1' }, req);

    expect(result).toEqual({ id: 'req-1' });
    expect(mockRequestsService.createRequest).toHaveBeenCalledWith(
      'trip-1',
      'user-1',
    );
  });

  it('debería crear solicitud usando viajeId', async () => {
    const req = { user: { userId: 'user-1' } };
    mockRequestsService.createRequest.mockResolvedValue({ id: 'req-1' });

    await controller.create({ viajeId: 'trip-1' }, req);

    expect(mockRequestsService.createRequest).toHaveBeenCalledWith(
      'trip-1',
      'user-1',
    );
  });

  it('debería actualizar estado', async () => {
    mockRequestsService.updateStatus.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.ACEPTADA,
    });

    const result = await controller.updateStatus('req-1', {
      conductor_id: 'driver-1',
      estado: RequestStatus.ACEPTADA,
    });

    expect(result.estado).toBe(RequestStatus.ACEPTADA);
    expect(mockRequestsService.updateStatus).toHaveBeenCalledWith(
      'req-1',
      'driver-1',
      RequestStatus.ACEPTADA,
    );
  });

  it('debería cancelar solicitud', async () => {
    const req = { user: { userId: 'user-1' } };

    mockRequestsService.cancelRequest.mockResolvedValue({
      id: 'req-1',
      estado: RequestStatus.CANCELADA,
    });

    const result = await controller.cancel(
      'req-1',
      { reason: 'Cambio de planes' },
      req,
    );

    expect(result.estado).toBe(RequestStatus.CANCELADA);
    expect(mockRequestsService.cancelRequest).toHaveBeenCalledWith(
      'req-1',
      'user-1',
      'Cambio de planes',
    );
  });
});
