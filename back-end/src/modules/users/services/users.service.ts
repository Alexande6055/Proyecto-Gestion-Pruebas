import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
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
      select: ['id', 'correo_institucional', 'password_hash', 'nombre', 'rol', 'estado'],
    });
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.findByEmail(registerDto.correo_institucional);
    if (existingUser) {
      throw new ConflictException('El correo institucional ya está registrado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const user = this.usersRepository.create({
      ...registerDto,
      password_hash: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.usersRepository.update(id, { password_hash: hashedPassword });
  }
}
