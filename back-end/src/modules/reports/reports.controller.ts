import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
