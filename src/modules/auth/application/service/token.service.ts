import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  DAY_MS,
  DEFAULT_REFRESH_MS,
  HOUR_MS,
  MINUTE_MS,
  SECOND_MS,
} from '@/common/constant/cache';
import {
  NUMERIC_EXPIRES_REGEX,
  UNIT_EXPIRES_REGEX,
} from '@/common/constant/regex';
import { SessionRepository } from '@/modules/session/infrastructure/repository/session.repository';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface DeviceInfo {
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async issueTokenPair(
    userId: string,
    email: string,
    deviceInfo?: DeviceInfo,
  ): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, email),
      this.signRefreshToken(userId, deviceInfo),
    ]);
    return { accessToken, refreshToken };
  }

  async validateAndRotateSession(
    oldToken: string,
    deviceInfo?: DeviceInfo,
  ): Promise<{ userId: string; newRefreshToken: string }> {
    const payload = await this.verifyRefreshToken(oldToken);
    const session = await this.sessionRepository.findActiveByTokenId(
      payload.sub,
      payload.jti,
    );

    if (!(session && this.compareHash(oldToken, session.token_hash))) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newTokenId = randomUUID();
    const expiresInMs = this.parseExpiresInToMs(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    const newExpiresAt = new Date(Date.now() + expiresInMs);

    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.getOrThrow<string>('JWT_SECRET');

    const newRefreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, jti: newTokenId },
      {
        secret,
        expiresIn: Math.floor(expiresInMs / SECOND_MS),
      },
    );

    await this.sessionRepository.rotateToken({
      userId: payload.sub,
      oldTokenId: payload.jti,
      newTokenId,
      newTokenHash: this.hashToken(newRefreshToken),
      newExpiresAt,
      lastUsedAt: new Date(),
      deviceType: deviceInfo?.deviceType,
      deviceName: deviceInfo?.deviceName,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
    });

    return { userId: payload.sub, newRefreshToken };
  }

  async signAccessToken(userId: string, email: string): Promise<string> {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const expiresIn = Number.parseInt(
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '3600',
      10,
    );
    return await this.jwtService.signAsync(
      { sub: userId, email },
      { secret, expiresIn },
    );
  }

  private async signRefreshToken(
    userId: string,
    deviceInfo?: DeviceInfo,
  ): Promise<string> {
    const tokenId = randomUUID();
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET');
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const refreshExpiresInMs = this.parseExpiresInToMs(refreshExpiresIn);
    const refreshExpiresInSeconds = Math.floor(refreshExpiresInMs / SECOND_MS);

    const token = await this.jwtService.signAsync(
      { sub: userId, jti: tokenId },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresInSeconds,
      },
    );

    const expiresAt = new Date(Date.now() + refreshExpiresInMs);
    await this.sessionRepository.create({
      userId,
      tokenId,
      tokenHash: this.hashToken(token),
      expiresAt,
      deviceType: deviceInfo?.deviceType,
      deviceName: deviceInfo?.deviceName,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
    });

    return token;
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET');

    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: refreshSecret,
      })) as RefreshTokenPayload;

      const { sub, jti } = payload ?? {};
      if (!sub) {
        throw new UnauthorizedException('Refresh token is invalid');
      }
      if (!jti) {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      return { sub, jti } as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private compareHash(token: string, hashed: string): boolean {
    const tokenHash = this.hashToken(token);
    const tokenBuffer = Buffer.from(tokenHash);
    const hashedBuffer = Buffer.from(hashed);

    if (tokenBuffer.length !== hashedBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, hashedBuffer);
  }

  private parseExpiresInToMs(value: string): number {
    const trimmed = value.trim();
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(numeric) && NUMERIC_EXPIRES_REGEX.test(trimmed)) {
      return numeric * SECOND_MS;
    }

    const match = trimmed.match(UNIT_EXPIRES_REGEX);
    if (!match) {
      return DEFAULT_REFRESH_MS;
    }

    const amount = Number.parseInt(match[1] ?? '0', 10);
    const unit = (match[2] ?? 'd').toLowerCase();

    switch (unit) {
      case 's':
        return amount * SECOND_MS;
      case 'm':
        return amount * MINUTE_MS;
      case 'h':
        return amount * HOUR_MS;
      default:
        return amount * DAY_MS;
    }
  }
}
