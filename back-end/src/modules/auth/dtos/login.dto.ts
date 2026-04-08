import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@uta.edu.ec', description: 'Correo institucional' })
  @IsEmail()
  correo_institucional: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;
}
