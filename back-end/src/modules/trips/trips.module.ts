import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { Trip } from './entities/trip.entity';
import { AuthModule } from '../auth/auth.module';
import { Request } from '../requests/entities/request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Request]),
    AuthModule,
  ],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
