import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

export enum RequestStatus {
  PENDIENTE = 'pendiente',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  CANCELADA = 'cancelada',
}

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, (trip) => trip.requests)
  @JoinColumn({ name: 'viaje_id' })
  viaje: Trip;

  @Column({ name: 'viaje_id' })
  viajeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'pasajero_id' })
  pasajero: User;

  @Column({ name: 'pasajero_id' })
  pasajeroId: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDIENTE,
  })
  estado: RequestStatus;

  @Column({ type: 'text', nullable: true })
  motivo_cancelacion: string;

  @CreateDateColumn({ name: 'fecha_solicitud' })
  fechaSolicitud: Date;
}

