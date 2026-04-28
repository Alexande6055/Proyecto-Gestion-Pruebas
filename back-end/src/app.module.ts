import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './modules/users/entities/user.entity';
import { Trip } from './modules/trips/entities/trip.entity';
import { Request } from './modules/requests/entities/request.entity';
import { Rating } from './modules/ratings/entities/rating.entity';
import { Report } from './modules/reports/entities/report.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TripsModule } from './modules/trips/trips.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Trip, Request, Rating, Report, AuditLog],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
      }),
    }),
    AuthModule,
    UsersModule,
    TripsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
