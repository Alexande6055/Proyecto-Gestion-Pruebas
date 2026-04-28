import { IsString, IsInt, IsDateString, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ example: 'Ficoa', description: 'Zona de origen' })
  @IsString()
  origen_zona: string;

  @ApiProperty({ example: 'Campus Huachi', description: 'Zona de destino' })
  @IsString()
  destino_zona: string;

  @ApiProperty({
    example: '2026-05-01T18:00:00Z',
    description: 'Fecha y hora del viaje',
  })
  @IsDateString()
  fecha_hora: string;

  @ApiProperty({ example: 4, description: 'Cupos disponibles' })
  @IsInt()
  @Min(1)
  cupos_disponibles: number;

  @ApiProperty({
    example: 'Puntualidad por favor, máximo 5 min de espera.',
    description: 'Notas o reglas del viaje',
    required: false,
  })
  @IsOptional()
  @IsString()
  notas_reglas?: string;
}
