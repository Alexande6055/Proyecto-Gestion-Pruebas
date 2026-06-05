import {
  Body,
  Controller,
  Patch,
  Post,
  Get,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { RecoverPasswordDto } from './dtos/recover-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordTokenDto } from './dtos/reset-password-token.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo estudiante' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o dominio de correo incorrecto',
  })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve JWT' })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o usuario suspendido',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  logout() {
    return { message: 'Sesión cerrada exitosamente' };
  }
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperacion de contrasena' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('reset-password')
  @ApiOperation({ summary: 'Restablecer contrasena con token temporal' })
  @ApiResponse({ status: 200, description: 'Contrasena restablecida' })
  resetPassword(@Body() resetPasswordTokenDto: ResetPasswordTokenDto) {
    return this.authService.resetPassword(resetPasswordTokenDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cambiar contrasena del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contrasena actualizada' })
  changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('recover-password')
  @ApiOperation({ summary: 'Solicitar recuperacion de contrasena' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
    return this.authService.recoverPassword(recoverPasswordDto);
  }

  @Get('activate/:code')
  @ApiOperation({ summary: 'Activar cuenta por codigo' })
  @ApiResponse({ status: 200, description: 'Cuenta activada exitosamente' })
  @ApiResponse({ status: 404, description: 'Codigo de activacion invalido' })
  async activate(@Param('code') code: string, @Res() res: Response) {
    try {
      await this.authService.activateAccount(code);
      return res
        .status(HttpStatus.OK)
        .type('text/html')
        .send(
          '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cuenta activada</title></head><body><h1>Cuenta activada</h1><p>Tu cuenta se ha activado correctamente.</p></body></html>',
        );
    } catch {
      return res
        .status(HttpStatus.NOT_FOUND)
        .type('text/html')
        .send(
          '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Activacion fallida</title></head><body><h1>Activacion fallida</h1><p>El codigo de activacion es invalido o ya fue utilizado.</p></body></html>',
        );
    }
  }
}
