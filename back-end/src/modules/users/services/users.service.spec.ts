import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User, UserStatus, UserRole } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería buscar usuario por correo institucional', async () => {
    const user = {
      id: '1',
      correo_institucional: 'usuario@uta.edu.ec',
      password_hash: 'hash',
      nombre: 'Dennis',
      rol: UserRole.ESTUDIANTE,
      estado: UserStatus.ACTIVO,
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findByEmail('usuario@uta.edu.ec');

    expect(result).toEqual(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { correo_institucional: 'usuario@uta.edu.ec' },
      select: [
        'id',
        'correo_institucional',
        'password_hash',
        'nombre',
        'rol',
        'estado',
      ],
    });
  });

  it('debería crear un usuario correctamente', async () => {
    const registerDto = {
      correo_institucional: 'usuario@uta.edu.ec',
      password: '123456',
      nombre: 'Dennis',
      carrera: 'Software',
      zona_barrio: 'Ambato',
    };

    const createdUser = {
      id: '1',
      correo_institucional: registerDto.correo_institucional,
      nombre: registerDto.nombre,
      password_hash: 'hashed-password',
      activation_code: 'activation-code',
      estado: UserStatus.PENDIENTE,
    };

    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockReturnValue(createdUser);
    mockRepository.save.mockResolvedValue(createdUser);

    const result = await service.create(registerDto as any);

    expect(result).toEqual(createdUser);
    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
  });

  it('debería lanzar ConflictException si el correo ya existe al crear usuario', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: '1',
      correo_institucional: 'usuario@uta.edu.ec',
    });

    await expect(
      service.create({
        correo_institucional: 'usuario@uta.edu.ec',
        password: '123456',
        nombre: 'Dennis',
        carrera: 'Software',
        zona_barrio: 'Ambato',
      } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('debería buscar usuario por id', async () => {
    const user = {
      id: '1',
      nombre: 'Dennis',
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findById('1');

    expect(result).toEqual(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('debería buscar usuario por id con password', async () => {
    const user = {
      id: '1',
      password_hash: 'hash',
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findByIdWithPassword('1');

    expect(result).toEqual(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      select: ['id', 'password_hash'],
    });
  });

  it('debería listar todos los usuarios', async () => {
    const users = [
      {
        id: '1',
        nombre: 'Dennis',
        correo_institucional: 'usuario@uta.edu.ec',
      },
    ] as User[];

    mockRepository.find.mockResolvedValue(users);

    const result = await service.findAll();

    expect(result).toEqual(users);
    expect(mockRepository.find).toHaveBeenCalled();
  });

  it('debería actualizar usuario correctamente', async () => {
    const user = {
      id: '1',
      nombre: 'Dennis',
    } as User;

    const updateDto = {
      nombre: 'Dennis Actualizado',
    };

    const updatedUser = {
      ...user,
      ...updateDto,
    } as User;

    mockRepository.findOne.mockResolvedValue(user);
    mockRepository.save.mockResolvedValue(updatedUser);

    const result = await service.update('1', updateDto);

    expect(result).toEqual(updatedUser);
    expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
  });

  it('debería lanzar NotFoundException al actualizar usuario inexistente', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('id-invalido', {
        nombre: 'Nuevo nombre',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería buscar usuario por código de activación', async () => {
    const user = {
      id: '1',
      estado: UserStatus.PENDIENTE,
      activation_code: 'abc123',
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    const result = await service.findByActivationCode('abc123');

    expect(result).toEqual(user);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { activation_code: 'abc123' },
      select: ['id', 'estado', 'activation_code'],
    });
  });

  it('debería activar usuario por código', async () => {
    const user = {
      id: '1',
      estado: UserStatus.PENDIENTE,
      activation_code: 'abc123',
    } as User;

    const activatedUser = {
      ...user,
      estado: UserStatus.ACTIVO,
      activation_code: undefined,
    } as User;

    mockRepository.findOne.mockResolvedValue(user);
    mockRepository.save.mockResolvedValue(activatedUser);

    const result = await service.activateByCode('abc123');

    expect(result).toEqual(activatedUser);
    expect(mockRepository.save).toHaveBeenCalledWith(activatedUser);
  });

  it('debería lanzar NotFoundException si código de activación no existe', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.activateByCode('codigo-invalido')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería actualizar contraseña correctamente', async () => {
    const user = {
      id: '1',
      password_hash: 'old-hash',
    } as User;

    mockRepository.findOne.mockResolvedValue(user);
    mockRepository.update.mockResolvedValue({ affected: 1 });

    await service.updatePassword('1', 'nuevaPassword123');

    expect(mockRepository.update).toHaveBeenCalledWith('1', {
      password_hash: expect.any(String),
      reset_password_token_hash: undefined,
      reset_password_expires_at: undefined,
    });
  });

  it('debería lanzar NotFoundException al actualizar contraseña de usuario inexistente', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updatePassword('id-invalido', 'nuevaPassword123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería guardar token de recuperación si el usuario existe', async () => {
    const user = {
      id: '1',
      correo_institucional: 'usuario@uta.edu.ec',
    } as User;

    const expiresAt = new Date();

    mockRepository.findOne.mockResolvedValue(user);
    mockRepository.update.mockResolvedValue({ affected: 1 });

    await service.storePasswordResetToken(
      'usuario@uta.edu.ec',
      'token-hash',
      expiresAt,
    );

    expect(mockRepository.update).toHaveBeenCalledWith('1', {
      reset_password_token_hash: 'token-hash',
      reset_password_expires_at: expiresAt,
    });
  });

  it('no debería guardar token de recuperación si el usuario no existe', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await service.storePasswordResetToken(
      'noexiste@uta.edu.ec',
      'token-hash',
      new Date(),
    );

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('debería actualizar contraseña por token válido', async () => {
    const user = {
      id: '1',
    } as User;

    mockRepository.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({
        id: '1',
        password_hash: 'old-hash',
      });

    mockRepository.update.mockResolvedValue({ affected: 1 });

    await service.updatePasswordByResetToken('token-hash', 'nuevaPassword123');

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: {
        reset_password_token_hash: 'token-hash',
        reset_password_expires_at: MoreThan(expect.any(Date)),
      },
      select: ['id'],
    });

    expect(mockRepository.update).toHaveBeenCalled();
  });

  it('debería lanzar UnauthorizedException si token es inválido o expirado', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updatePasswordByResetToken('token-invalido', 'nuevaPassword123'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería cambiar contraseña correctamente', async () => {
    const currentHash = await bcrypt.hash('actual123', 10);

    const user = {
      id: '1',
      password_hash: currentHash,
    } as User;

    mockRepository.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);

    mockRepository.update.mockResolvedValue({ affected: 1 });

    await service.changePassword('1', 'actual123', 'nueva123');

    expect(mockRepository.update).toHaveBeenCalledWith('1', {
      password_hash: expect.any(String),
      reset_password_token_hash: undefined,
      reset_password_expires_at: undefined,
    });
  });

  it('debería lanzar NotFoundException al cambiar contraseña si usuario no existe', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.changePassword('id-invalido', 'actual123', 'nueva123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar UnauthorizedException si contraseña actual es incorrecta', async () => {
    const currentHash = await bcrypt.hash('actual123', 10);

    const user = {
      id: '1',
      password_hash: currentHash,
    } as User;

    mockRepository.findOne.mockResolvedValue(user);

    await expect(
      service.changePassword('1', 'incorrecta', 'nueva123'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
