import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar reportes' })
  @ApiResponse({ status: 200, description: 'Reportes encontrados' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear reporte' })
  @ApiResponse({ status: 201, description: 'Reporte creado' })
  create(@Body() body: Partial<Report>) {
    return this.reportsService.create({
      ...body,
      reportanteId: body.reportanteId ?? (body as any).reportante_id,
      reportadoId: body.reportadoId ?? (body as any).reportado_id,
      viajeId: body.viajeId ?? (body as any).viaje_id,
    });
  }
}
