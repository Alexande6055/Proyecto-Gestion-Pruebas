import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    recoverPassword: jest.fn(),
    activateAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería llamar al servicio para login', async () => {
    const loginDto = {
      correo_institucional: 'usuario@uta.edu.ec',
      password: '123456',
    };

    mockAuthService.login.mockResolvedValue({
      access_token: 'fake-token',
    });

    const result = await controller.login(loginDto);

    expect(result).toEqual({
      access_token: 'fake-token',
    });
    expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
  });

  it('debería llamar al servicio para registro', async () => {
    const registerDto = {
      correo_institucional: 'usuario@uta.edu.ec',
      password: '123456',
      nombre: 'Dennis',
      carrera: 'Software',
      zona_barrio: 'Ambato',
    };

    mockAuthService.register.mockResolvedValue({
      id: '1',
      correo_institucional: 'usuario@uta.edu.ec',
    });

    const result = await controller.register(registerDto as any);

    expect(result).toEqual({
      id: '1',
      correo_institucional: 'usuario@uta.edu.ec',
    });
    expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
  });

  it('debería cerrar sesión correctamente', () => {
    const result = controller.logout();

    expect(result).toEqual({
      message: 'Sesión cerrada exitosamente',
    });
  });

  it('debería llamar al servicio para forgot-password', async () => {
    const dto = {
      correo_institucional: 'usuario@uta.edu.ec',
    };

    mockAuthService.requestPasswordReset.mockResolvedValue({
      message: 'Solicitud procesada',
    });

    const result = await controller.forgotPassword(dto as any);

    expect(result).toEqual({
      message: 'Solicitud procesada',
    });
    expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(dto);
  });

  it('debería llamar al servicio para reset-password', async () => {
    const dto = {
      token: 'token123',
      newPassword: '1234567',
    };

    mockAuthService.resetPassword.mockResolvedValue({
      message: 'Contrasena restablecida exitosamente',
    });

    const result = await controller.resetPassword(dto as any);

    expect(result).toEqual({
      message: 'Contrasena restablecida exitosamente',
    });
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
  });

  it('debería llamar al servicio para change-password', async () => {
    const req = {
      user: {
        userId: '1',
      },
    };

    const dto = {
      currentPassword: '123456',
      newPassword: '654321',
    };

    mockAuthService.changePassword.mockResolvedValue({
      message: 'Contrasena actualizada exitosamente',
    });

    const result = await controller.changePassword(req, dto as any);

    expect(result).toEqual({
      message: 'Contrasena actualizada exitosamente',
    });
    expect(mockAuthService.changePassword).toHaveBeenCalledWith('1', dto);
  });
});
