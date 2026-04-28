import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestsService } from './requests.service';
import { RequestsGateway } from './requests.gateway';
import { Trip } from '../trips/entities/trip.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Trip]),
    AuthModule,
  ],
  providers: [RequestsService, RequestsGateway],
  exports: [RequestsService],
})
export class RequestsModule {}
