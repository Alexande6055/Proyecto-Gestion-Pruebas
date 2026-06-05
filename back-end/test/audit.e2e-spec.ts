import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Audit E2E', () => {
  let app: INestApplication;

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

  it('GET /audit_logs sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .get('/audit_logs')
      .expect(401);
  });

  it('GET /audit_logs con token inválido debe devolver 401', async () => {
    await request(app.getHttpServer())
      .get('/audit_logs')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);
  });

  it('POST /audit_logs sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/audit_logs')
      .send({
        usuarioId: '550e8400-e29b-41d4-a716-446655440001',
        accion: 'CREATE',
        descripcion: 'Registro de prueba',
      })
      .expect(401);
  });

  it('POST /audit_logs con token inválido debe devolver 401', async () => {
    await request(app.getHttpServer())
      .post('/audit_logs')
      .set('Authorization', 'Bearer token-invalido')
      .send({
        usuarioId: '550e8400-e29b-41d4-a716-446655440001',
        accion: 'CREATE',
        descripcion: 'Registro de prueba',
      })
      .expect(401);
  });
});
