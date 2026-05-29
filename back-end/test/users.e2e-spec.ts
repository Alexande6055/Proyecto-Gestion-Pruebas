import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  let adminToken: string;
  let studentToken: string;

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

    adminToken = await jwtService.signAsync(
      {
        sub: 'admin-id-test',
        email: 'admin@uta.edu.ec',
        role: 'admin',
      },
      { secret },
    );

    studentToken = await jwtService.signAsync(
      {
        sub: 'student-id-test',
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

  it('GET /users sin token debe devolver 401', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('GET /users con rol estudiante debe devolver 403', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('PATCH /users/:id sin token debe devolver 401', async () => {
    await request(app.getHttpServer())
      .patch('/users/student-id-test')
      .send({
        nombre: 'Nuevo Nombre',
      })
      .expect(401);
  });

  it('PATCH /users/:id/reset-password con estudiante debe devolver 403', async () => {
    await request(app.getHttpServer())
      .patch('/users/student-id-test/reset-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        newPassword: '12345678',
      })
      .expect(403);
  });

  it('PATCH /users/:id debe rechazar foto_url inválida', async () => {
    await request(app.getHttpServer())
      .patch('/users/student-id-test')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        foto_url: 'no-es-url',
      })
      .expect(400);
  });
});
