import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
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
    await new Promise((resolve) => setTimeout(resolve, 500)); // Espera para asegurar que el proceso se cierre correctamente
  });

  it('POST /auth/login debe rechazar credenciales incorrectas', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo_institucional: 'noexiste@uta.edu.ec',
        password: '123456',
      })
      .expect(401);
  });

  it('POST /auth/logout debe cerrar sesión', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(200).expect({
      message: 'Sesión cerrada exitosamente',
    });
  });

  it('POST /auth/login debe rechazar correo inválido', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo_institucional: 'correo-invalido',
        password: '123456',
      })
      .expect(400);
  });

  it('POST /auth/login debe rechazar password menor a 6 caracteres', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo_institucional: 'usuario@uta.edu.ec',
        password: '123',
      })
      .expect(400);
  });

  it('POST /auth/login debe rechazar body vacío', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({}).expect(400);
  });
});
