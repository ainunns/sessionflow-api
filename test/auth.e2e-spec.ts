import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  createE2EApp,
  type E2EAppSetup,
  resetDatabase,
} from './helpers/e2e-app';

function uniqueEmail() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `user_${suffix}@example.com`;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let setup: E2EAppSetup;

  const password = 'StrongP@ss1';
  const newPassword = 'NewStrong@2';

  beforeAll(async () => {
    setup = await createE2EApp();
    app = setup.app;
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await setup.mongoServer.stop();
  });

  it('registers and logs in a user', async () => {
    const email = uniqueEmail();

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    expect(registerResponse.body.message).toBe('Registration successful');
    expect(registerResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        email,
      }),
    );

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginResponse.body.message).toBe('Login successful');
    expect(loginResponse.body.data).toEqual(
      expect.objectContaining({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(String),
          email,
        }),
      }),
    );
  });

  it('changes password and allows login with the new password', async () => {
    const email = uniqueEmail();

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const token = loginResponse.body.data.access_token as string;

    const changeResponse = await request(app.getHttpServer())
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        current_password: password,
        new_password: newPassword,
      })
      .expect(200);

    expect(changeResponse.body.message).toBe('Password changed successfully');
    expect(changeResponse.body.data).toBeNull();

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword })
      .expect(200);
  });
});
