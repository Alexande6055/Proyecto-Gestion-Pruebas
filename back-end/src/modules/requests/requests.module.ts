import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestsService } from './requests.service';
import { RequestsGateway } from './requests.gateway';
import { RequestsController } from './requests.controller';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Trip, User]),
    AuthModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService, RequestsGateway],
  exports: [RequestsService],
})
export class RequestsModule {}
