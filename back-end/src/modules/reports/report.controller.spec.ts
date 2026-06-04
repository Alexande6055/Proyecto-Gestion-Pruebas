import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportStatus } from './entities/report.entity';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    manageReport: jest.fn(),
  };

  const VALID_REPORT_ID = '550e8400-e29b-41d4-a716-446655440000';
  const REPORTANTE_ID = '550e8400-e29b-41d4-a716-446655440001';
  const REPORTADO_ID = '550e8400-e29b-41d4-a716-446655440002';
  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería listar reportes', async () => {
    const reports = [
      {
        id: VALID_REPORT_ID,
        reportanteId: REPORTANTE_ID,
        reportadoId: REPORTADO_ID,
        viajeId: VALID_TRIP_ID,
        motivo: 'Conducta inadecuada',
        estado: ReportStatus.PENDIENTE,
      },
    ];

    mockReportsService.findAll.mockResolvedValue(reports);

    const result = await controller.findAll();

    expect(result).toEqual(reports);
    expect(mockReportsService.findAll).toHaveBeenCalled();
  });

  it('debería crear un reporte usando reportadoId y viajeId', async () => {
    const req = {
      user: {
        userId: REPORTANTE_ID,
      },
    };

    const body = {
      reportadoId: REPORTADO_ID,
      viajeId: VALID_TRIP_ID,
      motivo: 'Conducta inadecuada',
      evidencia_url: 'https://example.com/evidencia.jpg',
    };

    const createdReport = {
      id: VALID_REPORT_ID,
      ...body,
      reportanteId: REPORTANTE_ID,
      estado: ReportStatus.PENDIENTE,
    };

    mockReportsService.create.mockResolvedValue(createdReport);

    const result = await controller.create(body, req);

    expect(result).toEqual(createdReport);
    expect(mockReportsService.create).toHaveBeenCalledWith({
      ...body,
      reportanteId: REPORTANTE_ID,
      reportadoId: REPORTADO_ID,
      viajeId: VALID_TRIP_ID,
    });
  });

  it('debería crear un reporte usando reportado_id y viaje_id', async () => {
    const req = {
      user: {
        userId: REPORTANTE_ID,
      },
    };

    const body = {
      reportado_id: REPORTADO_ID,
      viaje_id: VALID_TRIP_ID,
      motivo: 'Conducta inadecuada',
    };

    mockReportsService.create.mockResolvedValue({
      id: VALID_REPORT_ID,
      reportanteId: REPORTANTE_ID,
      reportadoId: REPORTADO_ID,
      viajeId: VALID_TRIP_ID,
      motivo: 'Conducta inadecuada',
    });

    await controller.create(body, req);

    expect(mockReportsService.create).toHaveBeenCalledWith({
      ...body,
      reportanteId: REPORTANTE_ID,
      reportadoId: REPORTADO_ID,
      viajeId: VALID_TRIP_ID,
    });
  });

  it('debería gestionar reporte aceptado', async () => {
    const managedReport = {
      id: VALID_REPORT_ID,
      estado: ReportStatus.RESUELTO,
      accion_tomada: 'Penalización aplicada',
    };

    mockReportsService.manageReport.mockResolvedValue(managedReport);

    const result = await controller.manageReport(VALID_REPORT_ID, {
      decision: 'aceptar',
      actionTaken: 'Penalización aplicada',
    });

    expect(result).toEqual(managedReport);
    expect(mockReportsService.manageReport).toHaveBeenCalledWith(
      VALID_REPORT_ID,
      'aceptar',
      'Penalización aplicada',
    );
  });

  it('debería gestionar reporte rechazado', async () => {
    const managedReport = {
      id: VALID_REPORT_ID,
      estado: ReportStatus.RECHAZADO,
      accion_tomada: 'No procede',
    };

    mockReportsService.manageReport.mockResolvedValue(managedReport);

    const result = await controller.manageReport(VALID_REPORT_ID, {
      decision: 'rechazar',
      actionTaken: 'No procede',
    });

    expect(result).toEqual(managedReport);
    expect(mockReportsService.manageReport).toHaveBeenCalledWith(
      VALID_REPORT_ID,
      'rechazar',
      'No procede',
    );
  });
});
