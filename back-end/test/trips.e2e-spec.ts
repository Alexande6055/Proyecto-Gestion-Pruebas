import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Trips E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  let driverToken: string;

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';

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

    driverToken = await jwtService.signAsync(
      {
        sub: '550e8400-e29b-41d4-a716-446655440001',
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

  it('GET /trips debe listar viajes', async () => {
    await request(app.getHttpServer()).get('/trips').expect(200);
  });

  it('GET /trips con filtros debe responder 200', async () => {
    await request(app.getHttpServer())
      .get('/trips')
      .query({
        zona: 'Ficoa',
        fecha: '2026-05-01',
        estado: 'abierto',
      })
      .expect(200);
  });

  it('GET /trips/:id con UUID inválido debe devolver 400', async () => {
    await request(app.getHttpServer())
      .get('/trips/id-invalido')
      .expect(400);
  });

  it('GET /trips/:id inexistente debe devolver 404', async () => {
    await request(app.getHttpServer())
      .get(`/trips/${VALID_TRIP_ID}`)
      .expect(404);
  });

  it('POST /trips sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/trips')
      .send({
        origen_zona: 'Ficoa',
        destino_zona: 'Campus Huachi',
        fecha_hora: '2026-05-01T18:00:00Z',
        cupos_disponibles: 4,
      })
      .expect(401);
  });

  it('POST /trips con token y DTO inválido debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origen_zona: '',
        destino_zona: 'Campus Huachi',
        fecha_hora: 'fecha-invalida',
        cupos_disponibles: 0,
      })
      .expect(400);
  });

  it('PATCH /trips/:id sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .patch(`/trips/${VALID_TRIP_ID}`)
      .send({
        destino_zona: 'Ingahurco',
      })
      .expect(401);
  });

  it('PATCH /trips/:id con UUID inválido debe devolver 400', async () => {
    await request(app.getHttpServer())
      .patch('/trips/id-invalido')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        destino_zona: 'Ingahurco',
      })
      .expect(400);
  });

  it('DELETE /trips/:id sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .delete(`/trips/${VALID_TRIP_ID}`)
      .expect(401);
  });

  it('POST /trips/:id/start sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post(`/trips/${VALID_TRIP_ID}/start`)
      .expect(401);
  });

  it('POST /trips/:id/complete sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post(`/trips/${VALID_TRIP_ID}/complete`)
      .expect(401);
  });
});
