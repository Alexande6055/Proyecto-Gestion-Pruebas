import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  "id": string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  "usuario": User;

  @Column({ name: 'usuario_id' })
  "usuarioId": string;

  @Column()
  "accion": string;

  @Column({ type: 'jsonb', nullable: true })
  "detalles": any;

  @CreateDateColumn({ name: 'fecha_hora' })
  "fechaHora": Date;
}
