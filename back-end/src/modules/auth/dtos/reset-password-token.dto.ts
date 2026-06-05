import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordTokenDto {
  @ApiProperty({ description: 'Token temporal recibido por correo' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nueva contrasena de la cuenta' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  newPassword: string;
}
