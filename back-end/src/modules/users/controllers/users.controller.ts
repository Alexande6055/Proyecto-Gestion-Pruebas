import {
  Controller,
  Body,
  ForbiddenException,
  Get,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, description: 'Usuarios encontrados' })
  findAll(@Req() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException(
        'Solo un administrador puede listar usuarios',
      );
    }

    return this.usersService.findAll();
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Editar información de un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      throw new ForbiddenException('No puedes editar otro usuario');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/reset-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Restablecer contraseña de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException(
        'Solo un administrador puede restablecer contrasenas de usuarios',
      );
    }

    return this.usersService.updatePassword(id, resetPasswordDto.newPassword);
  }
}
