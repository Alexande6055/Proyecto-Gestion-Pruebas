import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({
      relations: ['usuario'],
      order: { fechaHora: 'DESC' },
    });
  }

  async create(payload: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditRepository.create(payload);
    return this.auditRepository.save(log);
  }
}
