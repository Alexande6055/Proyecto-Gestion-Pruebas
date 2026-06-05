import { Body, Controller, Get, Post, Patch, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar reportes' })
  @ApiResponse({ status: 200, description: 'Reportes encontrados' })
  findAll(@Req() req: any) {
    return this.reportsService.findAll(req.user);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear reporte' })
  @ApiResponse({ status: 201, description: 'Reporte creado' })
  create(@Body() body: any, @Req() req: any) {
    return this.reportsService.create({
      ...body,
      reportanteId: req.user.userId,
      reportadoId: body.reportadoId ?? body.reportado_id,
      viajeId: body.viajeId ?? body.viaje_id,
    });
  }

  @Patch(':id/manage')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gestionar reporte (Aceptar/Rechazar)' })
  manageReport(
    @Param('id') id: string,
    @Body() body: { decision: 'aceptar' | 'rechazar'; actionTaken?: string },
    @Req() req: any,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Solo un administrador puede gestionar reportes');
    }
    return this.reportsService.manageReport(id, body.decision, body.actionTaken);
  }
}
