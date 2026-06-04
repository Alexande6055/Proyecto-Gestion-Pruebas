import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Reports E2E', () => {
  let app: INestApplication;

  const VALID_REPORT_ID = '550e8400-e29b-41d4-a716-446655440000';

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /reports debe listar reportes', async () => {
    await request(app.getHttpServer())
      .get('/reports')
      .expect(200);
  });

  it('POST /reports sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .send({
        reportadoId: '550e8400-e29b-41d4-a716-446655440002',
        viajeId: '550e8400-e29b-41d4-a716-446655440003',
        motivo: 'Conducta inadecuada',
      })
      .expect(401);
  });

  it('POST /reports con token inválido debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', 'Bearer token-invalido')
      .send({
        reportadoId: '550e8400-e29b-41d4-a716-446655440002',
        viajeId: '550e8400-e29b-41d4-a716-446655440003',
        motivo: 'Conducta inadecuada',
      })
      .expect(401);
  });

  it('PATCH /reports/:id/manage sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .patch(`/reports/${VALID_REPORT_ID}/manage`)
      .send({
        decision: 'aceptar',
        actionTaken: 'Penalización aplicada',
      })
      .expect(401);
  });

  it('PATCH /reports/:id/manage con token inválido debe devolver 401', async () => {
    await request(app.getHttpServer())
      .patch(`/reports/${VALID_REPORT_ID}/manage`)
      .set('Authorization', 'Bearer token-invalido')
      .send({
        decision: 'rechazar',
        actionTaken: 'No procede',
      })
      .expect(401);
  });
});
