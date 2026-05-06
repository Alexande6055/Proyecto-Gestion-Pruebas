import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

@ApiTags('audit_logs')
@Controller('audit_logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Listar auditoria' })
  @ApiResponse({ status: 200, description: 'Registros de auditoria encontrados' })
  findAll() {
    return this.auditService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear registro de auditoria' })
  @ApiResponse({ status: 201, description: 'Registro de auditoria creado' })
  create(@Body() body: Partial<AuditLog>) {
    return this.auditService.create({
      ...body,
      usuarioId: body.usuarioId ?? (body as any).usuario_id,
    });
  }
}
