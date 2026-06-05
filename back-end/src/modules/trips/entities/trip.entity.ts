import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Request } from '../../requests/entities/request.entity';
import { Rating } from '../../ratings/entities/rating.entity';

export enum TripStatus {
  ABIERTO = 'abierto',
  COMPLETO = 'completo',
  EN_CURSO = 'en_curso',
  CANCELADO = 'cancelado',
  FINALIZADO = 'finalizado',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  "id": string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'conductor_id' })
  "conductor": User;

  @Column({ name: 'conductor_id' })
  "conductorId": string;

  @Column()
  "origen_zona": string;

  @Column()
  "destino_zona": string;

  @Column({ type: 'timestamp' })
  "fecha_hora": Date;

  @Column()
  "cupos_disponibles": number;

  @Column({ type: 'text', nullable: true })
  "notas_reglas": string;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.ABIERTO,
  })
  "estado": TripStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  "origen_lat": number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  "origen_lng": number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  "destino_lat": number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  "destino_lng": number;

  @OneToMany(() => Request, (request) => request.viaje)
  "requests": Request[];

  @OneToMany(() => Rating, (rating) => rating.viaje)
  "ratings": Rating[];

  @CreateDateColumn()
  "created_at": Date;
}
