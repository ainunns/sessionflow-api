import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  createE2EApp,
  type E2EAppSetup,
  resetDatabase,
} from './helpers/e2e-app';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  let setup: E2EAppSetup;

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

  it('guards profile endpoint when unauthenticated', () =>
    request(app.getHttpServer()).get('/api/v1/profile').expect(401));
});
