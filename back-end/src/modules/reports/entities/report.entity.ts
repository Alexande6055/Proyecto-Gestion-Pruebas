import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';

export enum ReportStatus {
  PENDIENTE = 'pendiente',
  REVISADO = 'revisado',
  RESUELTO = 'resuelto',
  RECHAZADO = 'rechazado',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  "id": string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportante_id' })
  "reportante": User;

  @Column({ name: 'reportante_id' })
  "reportanteId": string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportado_id' })
  "reportado": User;

  @Column({ name: 'reportado_id' })
  "reportadoId": string;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'viaje_id' })
  "viaje": Trip;

  @Column({ name: 'viaje_id', nullable: true })
  "viajeId": string;

  @Column()
  "motivo": string;

  @Column({ nullable: true })
  "evidencia_url": string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDIENTE,
  })
  "estado": ReportStatus;

  @Column({ nullable: true })
  "accion_tomada": string;

  @CreateDateColumn()
  "created_at": Date;
}
