import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { RequestStatus } from '../src/modules/requests/entities/request.entity';

describe('Requests E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  let studentToken: string;
  let driverToken: string;

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_REQUEST_ID = '550e8400-e29b-41d4-a716-446655440010';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    const secret = configService.getOrThrow<string>('JWT_SECRET');

    studentToken = await jwtService.signAsync(
      {
        sub: '550e8400-e29b-41d4-a716-446655440001',
        email: 'student@uta.edu.ec',
        role: 'estudiante',
      },
      { secret },
    );

    driverToken = await jwtService.signAsync(
      {
        sub: '550e8400-e29b-41d4-a716-446655440002',
        email: 'driver@uta.edu.ec',
        role: 'estudiante',
      },
      { secret },
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /requests debe responder correctamente', async () => {
    await request(app.getHttpServer())
      .get('/requests')
      .expect(200);
  });

  it('POST /requests sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/requests')
      .send({
        viaje_id: VALID_TRIP_ID,
      })
      .expect(401);
  });

  it('POST /requests con viaje inválido debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        viaje_id: 'id-invalido',
      })
      .expect(400);
  });

  it('POST /requests con viajeId vacío debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        viajeId: '',
      })
      .expect(400);
  });

  it('PATCH /requests/:id/status con solicitud inexistente debe devolver 404', async () => {
    await request(app.getHttpServer())
      .patch(`/requests/${VALID_REQUEST_ID}/status`)
      .send({
        conductor_id: '550e8400-e29b-41d4-a716-446655440002',
        estado: RequestStatus.ACEPTADA,
      })
      .expect(404);
  });

  it('PATCH /requests/:id/status con estado inválido debe devolver 404', async () => {
    await request(app.getHttpServer())
      .patch(`/requests/${VALID_REQUEST_ID}/status`)
      .send({
        conductor_id: '550e8400-e29b-41d4-a716-446655440002',
        estado: 'estado-invalido',
      })
      .expect(404);
  });

  it('POST /requests/:id/cancel sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post(`/requests/${VALID_REQUEST_ID}/cancel`)
      .send({
        reason: 'No puedo viajar',
      })
      .expect(401);
  });

  it('POST /requests/:id/cancel con solicitud inexistente debe devolver 404', async () => {
    await request(app.getHttpServer())
      .post(`/requests/${VALID_REQUEST_ID}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        reason: 'No puedo viajar',
      })
      .expect(404);
  });

  it('POST /requests/:id/cancel sin motivo debe devolver error', async () => {
    await request(app.getHttpServer())
      .post(`/requests/${VALID_REQUEST_ID}/cancel`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        reason: '',
      })
      .expect(404);
  });
});
