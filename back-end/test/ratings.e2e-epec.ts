import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Ratings E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  let studentToken: string;

  const VALID_TRIP_ID = '550e8400-e29b-41d4-a716-446655440000';
  const CALIFICADO_ID = '550e8400-e29b-41d4-a716-446655440002';

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /ratings debe listar calificaciones', async () => {
    await request(app.getHttpServer()).get('/ratings').expect(200);
  });

  it('POST /ratings sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/ratings')
      .send({
        viajeId: VALID_TRIP_ID,
        calificadoId: CALIFICADO_ID,
        puntuacion: 5,
        comentario: 'Excelente',
      })
      .expect(401);
  });

  it('POST /ratings con token y viaje inexistente debe devolver 404', async () => {
    await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        viajeId: VALID_TRIP_ID,
        calificadoId: CALIFICADO_ID,
        puntuacion: 5,
        comentario: 'Excelente',
      })
      .expect(404);
  });

  it('POST /ratings con puntuación inválida debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        viajeId: VALID_TRIP_ID,
        calificadoId: CALIFICADO_ID,
        puntuacion: 10,
        comentario: 'Puntuación fuera de rango',
      })
      .expect(400);
  });

  it('POST /ratings con viajeId inválido debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        viajeId: 'id-invalido',
        calificadoId: CALIFICADO_ID,
        puntuacion: 5,
        comentario: 'Excelente',
      })
      .expect(400);
  });

  it('POST /ratings con calificadoId inválido debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        viajeId: VALID_TRIP_ID,
        calificadoId: 'id-invalido',
        puntuacion: 5,
        comentario: 'Excelente',
      })
      .expect(400);
  });

  it('POST /ratings con body vacío debe devolver 400', async () => {
    await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({})
      .expect(400);
  });
});
