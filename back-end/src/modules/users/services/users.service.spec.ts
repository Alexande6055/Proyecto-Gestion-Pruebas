import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserStatus, UserRole } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

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
    repository = module.get<Repository<User>>(getRepositoryToken(User));

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
    expect(repository.findOne).toHaveBeenCalledWith({
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
    expect(repository.find).toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException al actualizar usuario inexistente', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('id-invalido', {
        nombre: 'Nuevo nombre',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
