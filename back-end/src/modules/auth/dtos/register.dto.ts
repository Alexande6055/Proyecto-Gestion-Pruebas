import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'usuario@uta.edu.ec',
    description: 'Correo institucional del estudiante',
  })
  @IsEmail()
  @Matches(/^[a-z0-9._%+-]+@uta\.edu\.ec$/, {
    message: 'El correo debe pertenecer al dominio @uta.edu.ec',
  })
  correo_institucional: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña de la cuenta (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan Perez', description: 'Nombre completo del estudiante' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Ingeniería de Software', description: 'Carrera que cursa' })
  @IsString()
  carrera: string;

  @ApiProperty({ example: 'Ficoa', description: 'Zona o barrio de residencia' })
  @IsString()
  zona_barrio: string;

  @ApiProperty({
    example: '0987654321',
    description: 'Número de contacto (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'El teléfono debe tener exactamente 10 dígitos numéricos',
  })
  telefono?: string;
}
