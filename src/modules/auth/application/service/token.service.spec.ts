import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionRepository } from '@/modules/session/infrastructure/repository/session.repository';
import { type DeviceInfo, TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let sessionRepository: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    sessionRepository = {
      create: jest.fn(),
      findActiveByTokenId: jest.fn(),
      rotateToken: jest.fn(),
      revokeByTokenId: jest.fn(),
    } as unknown as jest.Mocked<SessionRepository>;

    service = new TokenService(jwtService, configService, sessionRepository);
  });

  it('issues token pair and persists the refresh session', async () => {
    const userId = 'user-123';
    const email = 'user@example.com';
    const deviceInfo: DeviceInfo = {
      deviceType: 'desktop',
      deviceName: 'MacBook',
      browser: 'Chrome',
      os: 'macOS',
      ipAddress: '203.0.113.8',
      userAgent: 'Mozilla/5.0',
    };

    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'access-secret';
      return 'access-secret';
    });

    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_EXPIRES_IN') return '3600';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      if (key === 'JWT_SECRET') return 'access-secret';
      return undefined;
    });

    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    sessionRepository.create.mockResolvedValue({
      user_id: userId,
      token_id: 'token-id',
      token_hash: 'hash',
      expires_at: new Date(),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    } as never);

    const result = await service.issueTokenPair(userId, email, deviceInfo);

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: userId, email },
      { secret: 'access-secret', expiresIn: 3600 },
    );

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: userId, jti: expect.any(String) },
      { secret: 'refresh-secret', expiresIn: expect.any(Number) },
    );

    const expectedHash = createHash('sha256')
      .update('refresh-token')
      .digest('hex');

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        tokenHash: expectedHash,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      }),
    );
  });

  it('rotates refresh token and returns new token', async () => {
    const oldToken = 'old-refresh-token';
    const oldTokenHash = createHash('sha256').update(oldToken).digest('hex');
    const deviceInfo: DeviceInfo = {
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      ipAddress: '203.0.113.9',
    };

    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '1h';
      if (key === 'JWT_SECRET') return 'access-secret';
      return undefined;
    });

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-456',
      jti: 'old-token-id',
    } as never);

    sessionRepository.findActiveByTokenId.mockResolvedValue({
      token_hash: oldTokenHash,
    } as never);

    jwtService.signAsync.mockResolvedValue('new-refresh-token');

    const result = await service.validateAndRotateSession(oldToken, deviceInfo);

    expect(result).toEqual({
      userId: 'user-456',
      newRefreshToken: 'new-refresh-token',
    });

    const expectedNewHash = createHash('sha256')
      .update('new-refresh-token')
      .digest('hex');

    expect(sessionRepository.rotateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-456',
        oldTokenId: 'old-token-id',
        newTokenHash: expectedNewHash,
        newExpiresAt: expect.any(Date),
        lastUsedAt: expect.any(Date),
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
      }),
    );
  });

  it('rejects invalid refresh tokens', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      service.validateAndRotateSession('bad-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh tokens without an active session', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-789',
      jti: 'missing-session',
    } as never);
    sessionRepository.findActiveByTokenId.mockResolvedValue(null);

    await expect(
      service.validateAndRotateSession('missing-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes the current refresh-token session', async () => {
    const refreshToken = 'current-refresh-token';
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    configService.get.mockImplementation((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_SECRET') return 'access-secret';
      return undefined;
    });

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-123',
      jti: 'token-id',
    } as never);

    sessionRepository.findActiveByTokenId.mockResolvedValue({
      token_hash: tokenHash,
    } as never);

    await service.revokeSession(refreshToken);

    expect(sessionRepository.revokeByTokenId).toHaveBeenCalledWith(
      'user-123',
      'token-id',
    );
  });

  it('rejects revocation when refresh token is not active', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-123',
      jti: 'token-id',
    } as never);

    sessionRepository.findActiveByTokenId.mockResolvedValue(null);

    await expect(service.revokeSession('revoked-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
