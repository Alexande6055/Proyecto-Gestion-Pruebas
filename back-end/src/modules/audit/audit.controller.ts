import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

@ApiTags('audit_logs')
@Controller('audit_logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Listar auditoria' })
  @ApiResponse({
    status: 200,
    description: 'Registros de auditoria encontrados',
  })
  findAll(@Req() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Solo un administrador puede ver auditoria');
    }

    return this.auditService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Crear registro de auditoria' })
  @ApiResponse({ status: 201, description: 'Registro de auditoria creado' })
  create(@Body() body: Partial<AuditLog>, @Req() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException(
        'Solo un administrador puede crear auditoria',
      );
    }

    return this.auditService.create({
      ...body,
      usuarioId: body.usuarioId ?? (body as any).usuario_id,
    });
  }
}
