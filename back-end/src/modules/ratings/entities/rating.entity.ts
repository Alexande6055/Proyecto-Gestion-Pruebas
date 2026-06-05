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

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  "id": string;

  @ManyToOne(() => Trip, (trip) => trip.ratings)
  @JoinColumn({ name: 'viaje_id' })
  "viaje": Trip;

  @Column({ name: 'viaje_id' })
  "viajeId": string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'calificador_id' })
  "calificador": User;

  @Column({ name: 'calificador_id' })
  "calificadorId": string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'calificado_id' })
  "calificado": User;

  @Column({ name: 'calificado_id' })
  "calificadoId": string;

  @Column()
  "puntuacion": number;

  @Column({ type: 'text', nullable: true })
  "comentario": string;

  @CreateDateColumn()
  "created_at": Date;
}
