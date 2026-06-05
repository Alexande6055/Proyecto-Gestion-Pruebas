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
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TripsModule } from './modules/trips/trips.module';
import { RequestsModule } from './modules/requests/requests.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const enableSsl = (configService.get<string>('DB_SSL') || 'false') === 'true';
        const extra = enableSsl ? { ssl: { rejectUnauthorized: false } } : undefined;

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [User, Trip, Request, Rating, Report],
          synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
          ...(extra ? { extra } : {}),
        } as any;
      },
    }),
    AuthModule,
    UsersModule,
    TripsModule,
    RequestsModule,
    RatingsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
