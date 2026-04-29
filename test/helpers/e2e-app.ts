import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { AppModule } from '../../src/app.module';
import { DatabaseModule } from '../../src/infrastructure/database/mongoose.module';

export interface E2EAppSetup {
  app: INestApplication;
  mongoServer: MongoMemoryServer;
}

export async function createE2EApp(): Promise<E2EAppSetup> {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '3600';

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(DatabaseModule)
    .useModule(MongooseModule.forRoot(mongoUri))
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1', { exclude: ['docs'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return { app, mongoServer };
}

export async function resetDatabase() {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
}
