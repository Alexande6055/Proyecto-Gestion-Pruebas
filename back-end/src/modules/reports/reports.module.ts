import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    UsersModule,
    RequestsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
