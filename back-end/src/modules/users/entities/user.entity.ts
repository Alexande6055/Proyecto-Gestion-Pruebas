import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsEmail, IsOptional, IsUrl, IsEnum } from 'class-validator';

export enum UserRole {
  ESTUDIANTE = 'estudiante',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVO = 'activo',
  SUSPENDIDO = 'suspendido',
  ADVERTIDO = 'advertido',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  'id': string;

  @Column({ unique: true })
  @IsEmail()
  'correo_institucional': string;

  @Column({ select: false }) // Hide password by default in queries
  'password_hash': string;

  @Column({ nullable: true, select: false })
  'reset_password_token_hash'?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  'reset_password_expires_at'?: Date;

  @Column()
  'nombre': string;

  @Column()
  'carrera': string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  'foto_url'?: string;

  @Column({ nullable: true })
  @IsOptional()
  'telefono'?: string;

  @Column()
  'zona_barrio': string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ESTUDIANTE,
  })
  @IsEnum(UserRole)
  'rol': UserRole;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0.0,
  })
  'reputacion_promedio': number;

  @Column({ default: 0 })
  'total_viajes': number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVO,
  })
  @IsEnum(UserStatus)
  'estado': UserStatus;

  @CreateDateColumn()
  'created_at': Date;
}
