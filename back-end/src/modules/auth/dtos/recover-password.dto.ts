import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

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
}
