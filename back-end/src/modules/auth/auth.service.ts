import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return {
      message: 'Usuario registrado exitosamente',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.correo_institucional);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado !== 'activo') {
      throw new UnauthorizedException(`Cuenta de usuario está: ${user.estado}`);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.correo_institucional, role: user.rol };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.correo_institucional,
        role: user.rol,
      },
    };
  }
}
