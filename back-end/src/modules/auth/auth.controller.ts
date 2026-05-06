import {
  Body,
  Controller,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { RecoverPasswordDto } from './dtos/recover-password.dto';

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
  @Patch('recover-password')
  @ApiOperation({ summary: 'Recuperar contrasena con correo institucional' })
  @ApiResponse({
    status: 200,
    description: 'Contrasena actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
    return this.authService.recoverPassword(recoverPasswordDto);
  }
}
