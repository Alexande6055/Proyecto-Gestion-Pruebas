import { IsOptional, IsString, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../entities/user.entity';


export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  carrera?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  foto_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zona_barrio?: string;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  estado?: UserStatus;
}
