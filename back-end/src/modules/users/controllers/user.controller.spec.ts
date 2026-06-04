import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { UserStatus } from '../entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería listar usuarios si el usuario es admin', async () => {
    const req = {
      user: {
        role: 'admin',
      },
    };

    const users = [
      {
        id: '1',
        nombre: 'Dennis',
        correo_institucional: 'usuario@uta.edu.ec',
      },
    ];

    mockUsersService.findAll.mockResolvedValue(users);

    const result = await controller.findAll(req);

    expect(result).toEqual(users);
    expect(mockUsersService.findAll).toHaveBeenCalled();
  });

  it('debería rechazar listar usuarios si no es admin', () => {
    const req = {
      user: {
        role: 'estudiante',
      },
    };

    expect(() => controller.findAll(req)).toThrow(ForbiddenException);
  });

  it('debería actualizar usuario si es admin', async () => {
    const req = {
      user: {
        role: 'admin',
        userId: 'admin-id',
      },
    };

    const updateDto = {
      nombre: 'Nuevo Nombre',
      estado: UserStatus.ACTIVO,
    };

    const updatedUser = {
      id: 'user-id',
      ...updateDto,
    };

    mockUsersService.update.mockResolvedValue(updatedUser);

    const result = await controller.update('user-id', updateDto, req);

    expect(result).toEqual(updatedUser);
    expect(mockUsersService.update).toHaveBeenCalledWith('user-id', updateDto);
  });

  it('debería actualizar su propio usuario si no es admin', async () => {
    const req = {
      user: {
        role: 'estudiante',
        userId: 'user-id',
      },
    };

    const updateDto = {
      nombre: 'Dennis Actualizado',
    };

    const updatedUser = {
      id: 'user-id',
      ...updateDto,
    };

    mockUsersService.update.mockResolvedValue(updatedUser);

    const result = await controller.update('user-id', updateDto, req);

    expect(result).toEqual(updatedUser);
    expect(mockUsersService.update).toHaveBeenCalledWith('user-id', updateDto);
  });

  it('debería rechazar actualizar otro usuario si no es admin', () => {
    const req = {
      user: {
        role: 'estudiante',
        userId: 'user-id',
      },
    };

    const updateDto = {
      nombre: 'Intento inválido',
    };

    expect(() =>
      controller.update('otro-user-id', updateDto, req),
    ).toThrow(ForbiddenException);
  });

  it('debería restablecer contraseña si es admin', async () => {
    const req = {
      user: {
        role: 'admin',
      },
    };

    const resetPasswordDto = {
      newPassword: '12345678',
    };

    mockUsersService.updatePassword.mockResolvedValue(undefined);

    const result = await controller.resetPassword(
      'user-id',
      resetPasswordDto,
      req,
    );

    expect(result).toBeUndefined();
    expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
      'user-id',
      '12345678',
    );
  });

  it('debería rechazar restablecer contraseña si no es admin', () => {
    const req = {
      user: {
        role: 'estudiante',
      },
    };

    const resetPasswordDto = {
      newPassword: '12345678',
    };

    expect(() =>
      controller.resetPassword('user-id', resetPasswordDto, req),
    ).toThrow(ForbiddenException);
  });
});
