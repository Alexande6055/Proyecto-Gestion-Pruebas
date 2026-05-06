import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RecoverPasswordDto } from './dtos/recover-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordTokenDto } from './dtos/reset-password-token.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

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
    const user = await this.usersService.findByEmail(
      loginDto.correo_institucional,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado !== 'activo') {
      throw new UnauthorizedException(`Cuenta de usuario está: ${user.estado}`);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.correo_institucional,
      role: user.rol,
    };

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
  async recoverPassword(recoverPasswordDto: RecoverPasswordDto) {
    return this.requestPasswordReset({
      correo_institucional: recoverPasswordDto.correo_institucional,
    });
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto) {
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.storePasswordResetToken(
      forgotPasswordDto.correo_institucional,
      tokenHash,
      expiresAt,
    );

    return {
      message:
        'Si el correo existe, enviaremos instrucciones para restablecer la contrasena.',
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : { devResetToken: resetToken }),
    };
  }

  async resetPassword(resetPasswordTokenDto: ResetPasswordTokenDto) {
    await this.usersService.updatePasswordByResetToken(
      this.hashToken(resetPasswordTokenDto.token),
      resetPasswordTokenDto.newPassword,
    );

    return { message: 'Contrasena restablecida exitosamente' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return { message: 'Contrasena actualizada exitosamente' };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
