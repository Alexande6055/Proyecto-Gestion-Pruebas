import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { UsersService } from '../users/services/users.service';
import { RequestsGateway } from '../requests/requests.gateway';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    private usersService: UsersService,
    private requestsGateway: RequestsGateway,
  ) {}

  async findAll(user: { userId: string, role: string }): Promise<Report[]> {
    const where = user.role === 'admin' 
      ? {} 
      : [
          { reportanteId: user.userId },
          { reportadoId: user.userId }
        ];
        
    return this.reportsRepository.find({
      where,
      relations: ['reportante', 'reportado', 'viaje', 'viaje.conductor'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['reportante', 'reportado', 'viaje'],
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    return report;
  }

  async create(payload: Partial<Report>): Promise<Report> {
    const report = this.reportsRepository.create(payload);
    // Guardar el reporte en estado pendiente (sin penalización automática aún)
    return this.reportsRepository.save(report);
  }

  async manageReport(id: string, decision: 'aceptar' | 'rechazar', actionTaken?: string): Promise<Report> {
    const report = await this.findOne(id);
    
    if (report.estado !== ReportStatus.PENDIENTE) {
      throw new BadRequestException('Este reporte ya ha sido gestionado');
    }

    if (decision === 'aceptar') {
      report.estado = ReportStatus.RESUELTO;
      report.accion_tomada = actionTaken || 'Reporte aceptado por el administrador. Penalización aplicada.';
      
      // Aplicar penalización automática (bajar 0.5 de reputación)
      if (report.reportadoId) {
          await this.usersService.applyPenalty(report.reportadoId, 0.5);
          
          // Notificar al usuario reportado vía WebSockets
          this.requestsGateway.notifyReport(report.reportadoId, report.motivo);
      }
    } else {
      report.estado = ReportStatus.RECHAZADO;
      report.accion_tomada = actionTaken || 'Reporte rechazado por el administrador.';
    }

    return this.reportsRepository.save(report);
  }
}
