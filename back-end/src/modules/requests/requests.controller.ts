import { Body, Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
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

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una solicitud de viaje' })
  cancel(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    return this.requestsService.cancelRequest(id, req.user.userId, body.reason);
  }
}
