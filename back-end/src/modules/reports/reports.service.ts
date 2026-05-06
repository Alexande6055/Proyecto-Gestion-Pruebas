import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: ['reportante', 'reportado', 'viaje'],
      order: { created_at: 'DESC' },
    });
  }

  async create(payload: Partial<Report>): Promise<Report> {
    const report = this.reportsRepository.create(payload);
    return this.reportsRepository.save(report);
  }
}
