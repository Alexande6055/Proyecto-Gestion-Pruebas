import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
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

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: ['reportante', 'reportado', 'viaje'],
      order: { created_at: 'DESC' },
    });
  }

  async create(payload: Partial<Report>): Promise<Report> {
    const report = this.reportsRepository.create(payload);
    const savedReport = await this.reportsRepository.save(report);

    // Aplicar penalización automática (bajar 0.5 de reputación)
    if (savedReport.reportadoId) {
        await this.usersService.applyPenalty(savedReport.reportadoId, 0.5);
        
        // Notificar al usuario reportado vía WebSockets
        this.requestsGateway.notifyReport(savedReport.reportadoId, savedReport.motivo);
    }

    return savedReport;
  }
}
