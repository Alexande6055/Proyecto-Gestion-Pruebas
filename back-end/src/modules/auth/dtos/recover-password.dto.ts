import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RecoverPasswordDto {
  @ApiProperty({
    example: 'usuario@uta.edu.ec',
    description: 'Correo institucional asociado a la cuenta',
  })
  @IsEmail()
  @Matches(/^[a-z0-9._%+-]+@uta\.edu\.ec$/, {
    message: 'El correo debe pertenecer al dominio @uta.edu.ec',
  })
  correo_institucional: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Nueva contrasena de la cuenta',
  })
  @IsString()
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  newPassword: string;
}
