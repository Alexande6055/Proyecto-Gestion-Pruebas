import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { UsersService } from '../users/services/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    activateByCode: jest.fn(),
    storePasswordResetToken: jest.fn(),
    updatePasswordByResetToken: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería lanzar UnauthorizedException si usuario no existe', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        correo_institucional: 'test@uta.edu.ec',
        password: '123456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería lanzar UnauthorizedException si usuario no está activo', async () => {
    mockUsersService.findByEmail.mockResolvedValue({
      id: '1',
      correo_institucional: 'test@uta.edu.ec',
      password_hash: 'hash',
      nombre: 'Dennis',
      rol: 'estudiante',
      estado: 'suspendido',
    });

    await expect(
      service.login({
        correo_institucional: 'test@uta.edu.ec',
        password: '123456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería hacer login correctamente', async () => {
    const bcrypt = require('bcrypt');

    const hashedPassword = await bcrypt.hash('123456', 10);

    mockUsersService.findByEmail.mockResolvedValue({
      id: '1',
      correo_institucional: 'test@uta.edu.ec',
      password_hash: hashedPassword,
      nombre: 'Dennis',
      rol: 'estudiante',
      estado: 'activo',
    });

    mockJwtService.signAsync.mockResolvedValue('fake-jwt-token');

    const result = await service.login({
      correo_institucional: 'test@uta.edu.ec',
      password: '123456',
    });

    expect(result).toHaveProperty('access_token');
    expect(result.access_token).toBe('fake-jwt-token');
  });

  it('debería generar token de recuperación', async () => {
    mockUsersService.storePasswordResetToken.mockResolvedValue(undefined);

    const result = await service.requestPasswordReset({
      correo_institucional: 'test@uta.edu.ec',
    });

    expect(result).toHaveProperty('message');
  });

  it('debería cambiar contraseña correctamente', async () => {
    mockUsersService.changePassword.mockResolvedValue(undefined);

    const result = await service.changePassword('1', {
      currentPassword: '123456',
      newPassword: '654321',
    });

    expect(result.message).toBe('Contrasena actualizada exitosamente');
  });
});
