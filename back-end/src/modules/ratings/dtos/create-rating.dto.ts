import { IsUUID, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ example: 'UUID-del-viaje' })
  @IsUUID()
  viajeId: string;

  @ApiProperty({ example: 'UUID-del-usuario-calificado' })
  @IsUUID()
  calificadoId: string;

  @ApiProperty({ example: 5, description: 'Puntuación del 1 al 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  puntuacion: number;

  @ApiProperty({ example: 'Excelente conductor, muy puntual.', required: false })
  @IsOptional()
  @IsString()
  comentario?: string;
}
