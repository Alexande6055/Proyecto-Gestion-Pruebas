import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@uta.edu.ec', description: 'Correo institucional' })
  @IsEmail()
  @Matches(/^[a-z0-9._%+-]+@uta\.edu\.ec$/, {
    message: 'El correo debe pertenecer al dominio @uta.edu.ec',
  })
  correo_institucional: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;
}
