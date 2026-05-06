import {
  Controller,
  Body,
  Get,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, description: 'Usuarios encontrados' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar información de un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña de un usuario' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.updatePassword(id, resetPasswordDto.newPassword);
  }
}
