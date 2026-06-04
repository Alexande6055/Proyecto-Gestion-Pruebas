import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ReportsService } from './reports.service';
import { Report, ReportStatus } from './entities/report.entity';
import { UsersService } from '../users/services/users.service';
import { RequestsGateway } from '../requests/requests.gateway';

describe('ReportsService', () => {
  let service: ReportsService;

  const VALID_REPORT_ID = '550e8400-e29b-41d4-a716-446655440000';
  const REPORTANTE_ID = '550e8400-e29b-41d4-a716-446655440001';
  const REPORTADO_ID = '550e8400-e29b-41d4-a716-446655440002';
  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440003';

  const mockReportsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUsersService = {
    applyPenalty: jest.fn(),
  };

  const mockRequestsGateway = {
    notifyReport: jest.fn(),
  };

  const pendingReport = {
    id: VALID_REPORT_ID,
    reportanteId: REPORTANTE_ID,
    reportadoId: REPORTADO_ID,
    viajeId: VALID_TRIP_ID,
    motivo: 'Conducta inadecuada',
    estado: ReportStatus.PENDIENTE,
    accion_tomada: null,
  } as Report;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RequestsGateway,
          useValue: mockRequestsGateway,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería listar reportes', async () => {
    const reports = [pendingReport];

    mockReportsRepository.find.mockResolvedValue(reports);

    const result = await service.findAll();

    expect(result).toEqual(reports);
    expect(mockReportsRepository.find).toHaveBeenCalledWith({
      relations: ['reportante', 'reportado', 'viaje'],
      order: { created_at: 'DESC' },
    });
  });

  it('debería obtener un reporte por id', async () => {
    mockReportsRepository.findOne.mockResolvedValue(pendingReport);

    const result = await service.findOne(VALID_REPORT_ID);

    expect(result).toEqual(pendingReport);
    expect(mockReportsRepository.findOne).toHaveBeenCalledWith({
      where: { id: VALID_REPORT_ID },
      relations: ['reportante', 'reportado', 'viaje'],
    });
  });

  it('debería lanzar NotFoundException si el reporte no existe', async () => {
    mockReportsRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(VALID_REPORT_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería crear un reporte', async () => {
    const payload = {
      reportanteId: REPORTANTE_ID,
      reportadoId: REPORTADO_ID,
      viajeId: VALID_TRIP_ID,
      motivo: 'Conducta inadecuada',
    };

    const createdReport = {
      id: VALID_REPORT_ID,
      ...payload,
      estado: ReportStatus.PENDIENTE,
    } as Report;

    mockReportsRepository.create.mockReturnValue(createdReport);
    mockReportsRepository.save.mockResolvedValue(createdReport);

    const result = await service.create(payload);

    expect(result).toEqual(createdReport);
    expect(mockReportsRepository.create).toHaveBeenCalledWith(payload);
    expect(mockReportsRepository.save).toHaveBeenCalledWith(createdReport);
  });

  it('debería aceptar un reporte, aplicar penalización y notificar al usuario reportado', async () => {
    const acceptedReport = {
      ...pendingReport,
      estado: ReportStatus.RESUELTO,
      accion_tomada: 'Penalización aplicada',
    } as Report;

    mockReportsRepository.findOne.mockResolvedValue({ ...pendingReport });
    mockUsersService.applyPenalty.mockResolvedValue(undefined);
    mockReportsRepository.save.mockResolvedValue(acceptedReport);

    const result = await service.manageReport(
      VALID_REPORT_ID,
      'aceptar',
      'Penalización aplicada',
    );

    expect(result).toEqual(acceptedReport);

    expect(mockUsersService.applyPenalty).toHaveBeenCalledWith(
      REPORTADO_ID,
      0.5,
    );

    expect(mockRequestsGateway.notifyReport).toHaveBeenCalledWith(
      REPORTADO_ID,
      'Conducta inadecuada',
    );

    expect(mockReportsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: ReportStatus.RESUELTO,
        accion_tomada: 'Penalización aplicada',
      }),
    );
  });

  it('debería aceptar un reporte usando acción por defecto', async () => {
    mockReportsRepository.findOne.mockResolvedValue({ ...pendingReport });
    mockUsersService.applyPenalty.mockResolvedValue(undefined);
    mockReportsRepository.save.mockImplementation((report) =>
      Promise.resolve(report),
    );

    const result = await service.manageReport(VALID_REPORT_ID, 'aceptar');

    expect(result.estado).toBe(ReportStatus.RESUELTO);
    expect(result.accion_tomada).toBe(
      'Reporte aceptado por el administrador. Penalización aplicada.',
    );
    expect(mockUsersService.applyPenalty).toHaveBeenCalledWith(
      REPORTADO_ID,
      0.5,
    );
    expect(mockRequestsGateway.notifyReport).toHaveBeenCalledWith(
      REPORTADO_ID,
      'Conducta inadecuada',
    );
  });

  it('debería rechazar un reporte', async () => {
    const rejectedReport = {
      ...pendingReport,
      estado: ReportStatus.RECHAZADO,
      accion_tomada: 'No procede',
    } as Report;

    mockReportsRepository.findOne.mockResolvedValue({ ...pendingReport });
    mockReportsRepository.save.mockResolvedValue(rejectedReport);

    const result = await service.manageReport(
      VALID_REPORT_ID,
      'rechazar',
      'No procede',
    );

    expect(result).toEqual(rejectedReport);
    expect(mockUsersService.applyPenalty).not.toHaveBeenCalled();
    expect(mockRequestsGateway.notifyReport).not.toHaveBeenCalled();

    expect(mockReportsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: ReportStatus.RECHAZADO,
        accion_tomada: 'No procede',
      }),
    );
  });

  it('debería rechazar un reporte usando acción por defecto', async () => {
    mockReportsRepository.findOne.mockResolvedValue({ ...pendingReport });
    mockReportsRepository.save.mockImplementation((report) =>
      Promise.resolve(report),
    );

    const result = await service.manageReport(VALID_REPORT_ID, 'rechazar');

    expect(result.estado).toBe(ReportStatus.RECHAZADO);
    expect(result.accion_tomada).toBe(
      'Reporte rechazado por el administrador.',
    );
  });

  it('debería lanzar BadRequestException si el reporte ya fue gestionado', async () => {
    mockReportsRepository.findOne.mockResolvedValue({
      ...pendingReport,
      estado: ReportStatus.RESUELTO,
    });

    await expect(
      service.manageReport(VALID_REPORT_ID, 'aceptar'),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería aceptar reporte aunque no tenga reportadoId sin aplicar penalización', async () => {
    mockReportsRepository.findOne.mockResolvedValue({
      ...pendingReport,
      reportadoId: null,
    });

    mockReportsRepository.save.mockImplementation((report) =>
      Promise.resolve(report),
    );

    const result = await service.manageReport(VALID_REPORT_ID, 'aceptar');

    expect(result.estado).toBe(ReportStatus.RESUELTO);
    expect(mockUsersService.applyPenalty).not.toHaveBeenCalled();
    expect(mockRequestsGateway.notifyReport).not.toHaveBeenCalled();
  });
});
