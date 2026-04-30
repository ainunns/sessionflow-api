import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
import mongoose from 'mongoose';
import {
  SessionEntity,
  SessionSchema,
} from '@/modules/session/infrastructure/schema/session.schema';
import { SessionRepository } from './session.repository';

describe('SessionRepository (integration)', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let repository: SessionRepository;
  let sessionModel: Model<SessionEntity>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoServer.getUri()),
        MongooseModule.forFeature([
          { name: SessionEntity.name, schema: SessionSchema },
        ]),
      ],
      providers: [SessionRepository],
    }).compile();

    repository = moduleRef.get(SessionRepository);
    sessionModel = moduleRef.get(getModelToken(SessionEntity.name));
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('creates a session with device info defaults', async () => {
    const expiresAt = new Date(Date.now() + 60_000);

    const session = await repository.create({
      userId: 'user-1',
      tokenId: 'token-1',
      tokenHash: 'hash-1',
      expiresAt,
      deviceType: 'desktop',
      deviceName: 'Laptop',
      browser: 'Chrome',
      os: 'Windows',
      ipAddress: '203.0.113.10',
      userAgent: 'Mozilla/5.0',
    });

    expect(session.user_id).toBe('user-1');
    expect(session.token_id).toBe('token-1');
    expect(session.token_hash).toBe('hash-1');
    expect(session.device_type).toBe('desktop');
    expect(session.device_name).toBe('Laptop');
    expect(session.browser).toBe('Chrome');
    expect(session.os).toBe('Windows');
    expect(session.ip_address).toBe('203.0.113.10');
    expect(session.user_agent).toBe('Mozilla/5.0');
    expect(session.expires_at).toEqual(expiresAt);
    expect(session.is_active).toBe(true);
    expect(session.last_used_at).toBeInstanceOf(Date);
  });

  it('returns only active sessions by token id', async () => {
    await sessionModel.create({
      user_id: 'user-2',
      token_id: 'active-token',
      token_hash: 'hash-active',
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
      is_active: true,
    });

    await sessionModel.create({
      user_id: 'user-2',
      token_id: 'expired-token',
      token_hash: 'hash-expired',
      expires_at: new Date(Date.now() - 60_000),
      revoked_at: null,
      is_active: true,
    });

    await sessionModel.create({
      user_id: 'user-2',
      token_id: 'revoked-token',
      token_hash: 'hash-revoked',
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: new Date(),
      is_active: false,
    });

    const active = await repository.findActiveByTokenId(
      'user-2',
      'active-token',
    );
    const expired = await repository.findActiveByTokenId(
      'user-2',
      'expired-token',
    );
    const revoked = await repository.findActiveByTokenId(
      'user-2',
      'revoked-token',
    );

    expect(active?.token_id).toBe('active-token');
    expect(expired).toBeNull();
    expect(revoked).toBeNull();
  });

  it('rotates a session token', async () => {
    await repository.create({
      userId: 'user-3',
      tokenId: 'old-token',
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const updated = await repository.rotateToken({
      userId: 'user-3',
      oldTokenId: 'old-token',
      newTokenId: 'new-token',
      newTokenHash: 'new-hash',
      newExpiresAt: new Date(Date.now() + 120_000),
      lastUsedAt: new Date(),
      deviceType: 'desktop',
      deviceName: 'Workstation',
      browser: 'Firefox',
      os: 'Linux',
      ipAddress: '198.51.100.5',
      userAgent: 'Mozilla/5.0',
    });

    expect(updated?.token_id).toBe('new-token');
    expect(updated?.token_hash).toBe('new-hash');
    expect(updated?.device_name).toBe('Workstation');
    expect(updated?.browser).toBe('Firefox');
    expect(updated?.os).toBe('Linux');
    expect(updated?.ip_address).toBe('198.51.100.5');
    expect(updated?.is_active).toBe(true);
    expect(updated?.revoked_at).toBeNull();

    const stored = await sessionModel.findOne({ token_id: 'new-token' }).lean();
    expect(stored?.token_hash).toBe('new-hash');
  });

  it('revokes a session by token id', async () => {
    await repository.create({
      userId: 'user-4',
      tokenId: 'token-to-revoke',
      tokenHash: 'hash-to-revoke',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await repository.revokeByTokenId('user-4', 'token-to-revoke');

    const revoked = await sessionModel
      .findOne({ user_id: 'user-4', token_id: 'token-to-revoke' })
      .lean();

    expect(revoked?.revoked_at).toBeInstanceOf(Date);
    expect(revoked?.is_active).toBe(false);
  });
});
