import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dtos/create-rating.dto';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calificar a un usuario participante de un viaje finalizado' })
  @ApiResponse({ status: 201, description: 'Calificación registrada y reputación actualizada' })
  @ApiResponse({ status: 400, description: 'Error en la validación o participación' })
  create(@Body() createRatingDto: CreateRatingDto, @Req() req: any) {
    return this.ratingsService.create(createRatingDto, req.user.userId);
  }
}
