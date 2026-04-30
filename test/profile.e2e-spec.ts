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

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;
  let setup: E2EAppSetup;

  const password = 'StrongP@ss1';

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

  it('returns the current user profile', async () => {
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

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meResponse.body.message).toBe('User fetched successfully');
    expect(meResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        email,
      }),
    );
  });

  it('updates the current user profile', async () => {
    const email = uniqueEmail();
    const updatedEmail = uniqueEmail();

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const token = loginResponse.body.data.access_token as string;

    const updateResponse = await request(app.getHttpServer())
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: updatedEmail })
      .expect(200);

    expect(updateResponse.body.message).toBe('User updated successfully');
    expect(updateResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        email: updatedEmail,
      }),
    );
  });
});
