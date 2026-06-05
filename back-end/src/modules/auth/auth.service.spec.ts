import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

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
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    global.fetch = jest.fn();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería registrar usuario y enviar correo de activación', async () => {
    const registerDto = {
      correo_institucional: 'usuario@uta.edu.ec',
      password: '123456',
      nombre: 'Dennis',
      carrera: 'Software',
      zona_barrio: 'Ambato',
    };

    mockUsersService.create.mockResolvedValue({
      id: 'user-id',
      correo_institucional: 'usuario@uta.edu.ec',
      nombre: 'Dennis',
      activation_code: 'abc123',
    });

    mockConfigService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        APP_BASE_URL: 'http://localhost:3000',
        EMAIL_API_URL: 'http://email-api.test/send',
        EMAIL_API_TOKEN: 'token-test',
      };

      return values[key];
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const result = await service.register(registerDto as any);

    expect(result.message).toBe('Usuario registrado exitosamente');
    expect(result.userId).toBe('user-id');
    expect(result.activationCode).toBe('abc123');
    expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('debería lanzar InternalServerErrorException si correo no está configurado', async () => {
    mockUsersService.create.mockResolvedValue({
      id: 'user-id',
      correo_institucional: 'usuario@uta.edu.ec',
      nombre: 'Dennis',
      activation_code: 'abc123',
    });

    mockConfigService.get.mockReturnValue(undefined);

    await expect(
      service.register({
        correo_institucional: 'usuario@uta.edu.ec',
        password: '123456',
        nombre: 'Dennis',
        carrera: 'Software',
        zona_barrio: 'Ambato',
      } as any),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('debería lanzar InternalServerErrorException si falla el envío de correo', async () => {
    mockUsersService.create.mockResolvedValue({
      id: 'user-id',
      correo_institucional: 'usuario@uta.edu.ec',
      nombre: 'Dennis',
      activation_code: 'abc123',
    });

    mockConfigService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        APP_BASE_URL: 'http://localhost:3000',
        EMAIL_API_URL: 'http://email-api.test/send',
        EMAIL_API_TOKEN: 'token-test',
      };

      return values[key];
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: jest.fn().mockResolvedValue('error body'),
    });

    await expect(
      service.register({
        correo_institucional: 'usuario@uta.edu.ec',
        password: '123456',
        nombre: 'Dennis',
        carrera: 'Software',
        zona_barrio: 'Ambato',
      } as any),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('debería activar cuenta correctamente', async () => {
    mockUsersService.activateByCode.mockResolvedValue(undefined);

    const result = await service.activateAccount('abc123');

    expect(result).toEqual({
      message: 'Cuenta activada correctamente',
    });
    expect(mockUsersService.activateByCode).toHaveBeenCalledWith('abc123');
  });

  it('debería hacer login correctamente', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);

    mockUsersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      correo_institucional: 'usuario@uta.edu.ec',
      password_hash: hashedPassword,
      nombre: 'Dennis',
      rol: 'estudiante',
      estado: 'activo',
    });

    mockJwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login({
      correo_institucional: 'usuario@uta.edu.ec',
      password: '123456',
    });

    expect(result.access_token).toBe('jwt-token');
    expect(result.user).toEqual({
      id: 'user-id',
      nombre: 'Dennis',
      email: 'usuario@uta.edu.ec',
      role: 'estudiante',
    });
  });

  it('debería rechazar login si usuario no existe', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        correo_institucional: 'usuario@uta.edu.ec',
        password: '123456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería rechazar login si usuario no está activo', async () => {
    mockUsersService.findByEmail.mockResolvedValue({
      estado: 'suspendido',
    });

    await expect(
      service.login({
        correo_institucional: 'usuario@uta.edu.ec',
        password: '123456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería rechazar login si contraseña es incorrecta', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);

    mockUsersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      correo_institucional: 'usuario@uta.edu.ec',
      password_hash: hashedPassword,
      nombre: 'Dennis',
      rol: 'estudiante',
      estado: 'activo',
    });

    await expect(
      service.login({
        correo_institucional: 'usuario@uta.edu.ec',
        password: 'incorrecta',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería solicitar recuperación de contraseña', async () => {
    mockUsersService.storePasswordResetToken.mockResolvedValue(undefined);

    const result = await service.requestPasswordReset({
      correo_institucional: 'usuario@uta.edu.ec',
    });

    expect(result.message).toBe(
      'Si el correo existe, enviaremos instrucciones para restablecer la contrasena.',
    );
    expect(result).toHaveProperty('devResetToken');
    expect(mockUsersService.storePasswordResetToken).toHaveBeenCalled();
  });

  it('debería llamar requestPasswordReset desde recoverPassword', async () => {
    mockUsersService.storePasswordResetToken.mockResolvedValue(undefined);

    const result = await service.recoverPassword({
      correo_institucional: 'usuario@uta.edu.ec',
    });

    expect(result).toHaveProperty('message');
    expect(mockUsersService.storePasswordResetToken).toHaveBeenCalled();
  });

  it('debería restablecer contraseña con token', async () => {
    mockUsersService.updatePasswordByResetToken.mockResolvedValue(undefined);

    const result = await service.resetPassword({
      token: 'token-test',
      newPassword: '12345678',
    });

    expect(result).toEqual({
      message: 'Contrasena restablecida exitosamente',
    });
    expect(mockUsersService.updatePasswordByResetToken).toHaveBeenCalled();
  });

  it('debería cambiar contraseña correctamente', async () => {
    mockUsersService.changePassword.mockResolvedValue(undefined);

    const result = await service.changePassword('user-id', {
      currentPassword: '123456',
      newPassword: '12345678',
    });

    expect(result).toEqual({
      message: 'Contrasena actualizada exitosamente',
    });
    expect(mockUsersService.changePassword).toHaveBeenCalledWith(
      'user-id',
      '123456',
      '12345678',
    );
  });
});
