import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { RequestStatus } from './entities/request.entity';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes' })
  @ApiResponse({ status: 200, description: 'Solicitudes encontradas' })
  findAll() {
    return this.requestsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear solicitud desde panel administrativo' })
  @ApiResponse({ status: 201, description: 'Solicitud creada' })
  create(@Body() body: { viaje_id?: string; viajeId?: string; pasajero_id?: string; pasajeroId?: string }) {
    return this.requestsService.createRequest(
      body.viaje_id ?? body.viajeId ?? '',
      body.pasajero_id ?? body.pasajeroId ?? '',
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de solicitud' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { conductor_id?: string; conductorId?: string; estado: RequestStatus },
  ) {
    return this.requestsService.updateStatus(
      id,
      body.conductor_id ?? body.conductorId ?? '',
      body.estado,
    );
  }
}
