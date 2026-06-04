import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;

  const USER_ID = '550e8400-e29b-41d4-a716-446655440001';

  const mockAuditRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería listar registros de auditoría', async () => {
    const logs = [
      {
        id: 'audit-1',
        usuarioId: USER_ID,
        accion: 'LOGIN',
        descripcion: 'Inicio de sesión',
        fechaHora: new Date(),
      },
    ];

    mockAuditRepository.find.mockResolvedValue(logs);

    const result = await service.findAll();

    expect(result).toEqual(logs);
    expect(mockAuditRepository.find).toHaveBeenCalledWith({
      relations: ['usuario'],
      order: { fechaHora: 'DESC' },
    });
  });

  it('debería crear un registro de auditoría', async () => {
    const payload = {
      usuarioId: USER_ID,
      accion: 'CREATE',
      descripcion: 'Creación de registro',
    };

    const createdLog = {
      id: 'audit-1',
      ...payload,
      fechaHora: new Date(),
    };

    mockAuditRepository.create.mockReturnValue(createdLog);
    mockAuditRepository.save.mockResolvedValue(createdLog);

    const result = await service.create(payload as any);

    expect(result).toEqual(createdLog);
    expect(mockAuditRepository.create).toHaveBeenCalledWith(payload);
    expect(mockAuditRepository.save).toHaveBeenCalledWith(createdLog);
  });
});
