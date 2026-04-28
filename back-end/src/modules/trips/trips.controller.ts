import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Req,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dtos/create-trip.dto';

@ApiTags('trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar un nuevo viaje' })
  @ApiResponse({ status: 201, description: 'Viaje publicado exitosamente' })
  create(@Body() createTripDto: CreateTripDto, @Req() req: any) {
    return this.tripsService.create(createTripDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar viajes disponibles con filtros' })
  @ApiQuery({ name: 'zona', required: false, description: 'Filtrar por zona de origen o destino' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  findAll(@Query('zona') zona?: string, @Query('fecha') fecha?: string) {
    return this.tripsService.findAll({ zona, fecha });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un viaje' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripsService.findOne(id);
  }

  @Post(':id/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar un viaje como finalizado (solo conductor)' })
  @ApiResponse({ status: 200, description: 'Viaje finalizado exitosamente' })
  complete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.tripsService.completeTrip(id, req.user.userId);
  }
}
