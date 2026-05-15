import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { User, UserStatus } from '../entities/user.entity';
import { RegisterDto } from '../../auth/dtos/register.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { correo_institucional: email },
      select: [
        'id',
        'correo_institucional',
        'password_hash',
        'nombre',
        'rol',
        'estado',
      ],
    });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password_hash'],
    });
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.findByEmail(
      registerDto.correo_institucional,
    );
    if (existingUser) {
      throw new ConflictException('El correo institucional ya está registrado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const activationCode = randomBytes(16).toString('hex');
    const user = this.usersRepository.create({
      ...registerDto,
      password_hash: hashedPassword,
      activation_code: activationCode,
      estado: UserStatus.PENDIENTE,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async findByActivationCode(code: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { activation_code: code },
      select: ['id', 'estado', 'activation_code'],
    });
  }

  async activateByCode(code: string): Promise<User> {
    const user = await this.findByActivationCode(code);
    if (!user) {
      throw new NotFoundException('Codigo de activacion invalido');
    }

    user.estado = UserStatus.ACTIVO;
    user.activation_code = undefined;
    return this.usersRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.usersRepository.update(id, {
      password_hash: hashedPassword,
      reset_password_token_hash: undefined,
      reset_password_expires_at: undefined,
    });
  }

  async storePasswordResetToken(
    email: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }

    await this.usersRepository.update(user.id, {
      reset_password_token_hash: tokenHash,
      reset_password_expires_at: expiresAt,
    });
  }

  async updatePasswordByResetToken(
    tokenHash: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: {
        reset_password_token_hash: tokenHash,
        reset_password_expires_at: MoreThan(new Date()),
      },
      select: ['id'],
    });

    if (!user) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    await this.updatePassword(user.id, newPassword);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contrasena actual no es correcta');
    }

    await this.updatePassword(userId, newPassword);
  }
}
