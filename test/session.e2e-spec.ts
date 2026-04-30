import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  createE2EApp,
  type E2EAppSetup,
  resetDatabase,
} from './helpers/e2e-app';

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  email: string;
};

function uniqueEmail() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `user_${suffix}@example.com`;
}

describe('Sessions (e2e)', () => {
  let app: INestApplication<App>;
  let setup: E2EAppSetup;
  let jwtService: JwtService;

  const password = 'StrongP@ss1';
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
  const forwardedFor = '203.0.113.10';

  const accessSecret = process.env.JWT_SECRET ?? 'test-secret';
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'test-secret';

  beforeAll(async () => {
    setup = await createE2EApp();
    app = setup.app;
    jwtService = new JwtService({});
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await setup.mongoServer.stop();
  });

  const registerAndLogin = async (): Promise<LoginResult> => {
    const email = uniqueEmail();

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('User-Agent', userAgent)
      .set('x-forwarded-for', forwardedFor)
      .send({ email, password })
      .expect(200);

    return {
      accessToken: loginResponse.body.data.access_token as string,
      refreshToken: loginResponse.body.data.refresh_token as string,
      email,
    };
  };

  it('rejects missing, invalid, and expired access tokens', async () => {
    await request(app.getHttpServer()).get('/api/v1/sessions').expect(401);

    const invalidToken = jwtService.sign(
      { sub: 'user-1', email: 'invalid@example.com' },
      { secret: 'wrong-secret', expiresIn: 3600 },
    );

    await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    const expiredToken = jwtService.sign(
      { sub: 'user-1', email: 'expired@example.com' },
      { secret: accessSecret, expiresIn: -10 },
    );

    await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('allows access with a valid access token', async () => {
    const { accessToken } = await registerAndLogin();

    await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('records device info for login sessions', async () => {
    const { accessToken } = await registerAndLogin();

    const sessionsResponse = await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(sessionsResponse.body.data).toHaveLength(1);
    expect(sessionsResponse.body.meta).toEqual(
      expect.objectContaining({ total: 1, page: 1, per_page: 10 }),
    );

    const session = sessionsResponse.body.data[0];
    expect(session).toEqual(
      expect.objectContaining({
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        ip_address: forwardedFor,
        is_active: true,
      }),
    );
  });

  it('rotates sessions on refresh and invalidates old refresh tokens', async () => {
    const { refreshToken, accessToken } = await registerAndLogin();

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('User-Agent', userAgent)
      .set('x-forwarded-for', forwardedFor)
      .send({ refresh_token: refreshToken })
      .expect(200);

    const newRefreshToken = refreshResponse.body.data.refresh_token as string;

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(401);

    const oldPayload = jwtService.verify(refreshToken, {
      secret: refreshSecret,
    }) as { jti: string };

    const newPayload = jwtService.verify(newRefreshToken, {
      secret: refreshSecret,
    }) as { jti: string };

    const sessionsResponse = await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const sessionIds = sessionsResponse.body.data.map(
      (item: { id: string }) => item.id,
    );

    expect(sessionIds).toContain(newPayload.jti);
    expect(sessionIds).not.toContain(oldPayload.jti);
  });

  it('revokes sessions by token id', async () => {
    const { accessToken } = await registerAndLogin();

    const sessionsResponse = await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const sessionId = sessionsResponse.body.data[0].id as string;

    await request(app.getHttpServer())
      .delete(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const afterRevoke = await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(afterRevoke.body.data).toHaveLength(0);
    expect(afterRevoke.body.meta).toEqual(
      expect.objectContaining({ total: 0, page: 1, per_page: 10 }),
    );
  });
});
