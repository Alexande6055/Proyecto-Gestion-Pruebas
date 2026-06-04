import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;

  const USER_ID = '550e8400-e29b-41d4-a716-446655440001';

  const mockAuditService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const adminReq = {
    user: {
      userId: USER_ID,
      role: 'admin',
    },
  };

  const studentReq = {
    user: {
      userId: USER_ID,
      role: 'estudiante',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería listar auditoría si el usuario es admin', async () => {
    const logs = [
      {
        id: 'audit-1',
        usuarioId: USER_ID,
        accion: 'LOGIN',
        descripcion: 'Inicio de sesión',
      },
    ];

    mockAuditService.findAll.mockResolvedValue(logs);

    const result = await controller.findAll(adminReq);

    expect(result).toEqual(logs);
    expect(mockAuditService.findAll).toHaveBeenCalled();
  });

  it('debería bloquear listar auditoría si el usuario no es admin', () => {
    expect(() => controller.findAll(studentReq)).toThrow(ForbiddenException);

    expect(mockAuditService.findAll).not.toHaveBeenCalled();
  });

  it('debería crear auditoría si el usuario es admin usando usuarioId', async () => {
    const body = {
      usuarioId: USER_ID,
      accion: 'CREATE',
      descripcion: 'Creación de registro',
    };

    const createdLog = {
      id: 'audit-1',
      ...body,
    };

    mockAuditService.create.mockResolvedValue(createdLog);

    const result = await controller.create(body as any, adminReq);

    expect(result).toEqual(createdLog);
    expect(mockAuditService.create).toHaveBeenCalledWith({
      ...body,
      usuarioId: USER_ID,
    });
  });

  it('debería crear auditoría si el usuario es admin usando usuario_id', async () => {
    const body = {
      usuario_id: USER_ID,
      accion: 'UPDATE',
      descripcion: 'Actualización de registro',
    };

    mockAuditService.create.mockResolvedValue({
      id: 'audit-2',
      usuarioId: USER_ID,
      accion: 'UPDATE',
      descripcion: 'Actualización de registro',
    });

    await controller.create(body as any, adminReq);

    expect(mockAuditService.create).toHaveBeenCalledWith({
      ...body,
      usuarioId: USER_ID,
    });
  });

  it('debería bloquear crear auditoría si el usuario no es admin', () => {
    const body = {
      usuarioId: USER_ID,
      accion: 'CREATE',
      detalles: {
        mensaje: 'Creación de registro',
      },
    };

    expect(() => controller.create(body as any, studentReq)).toThrow(
      ForbiddenException,
    );

    expect(mockAuditService.create).not.toHaveBeenCalled();
  });
});
