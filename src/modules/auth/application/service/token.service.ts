import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from '@/modules/session/infrastructure/repository/refresh-token.repository';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DEFAULT_REFRESH_DAYS = 7;
const DEFAULT_REFRESH_MS = DEFAULT_REFRESH_DAYS * DAY_MS;
const NUMERIC_EXPIRES_REGEX = /^[0-9]+$/;
const UNIT_EXPIRES_REGEX = /^([0-9]+)\s*([smhd])$/i;

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async issueTokenPair(userId: string, email: string): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      email,
    });

    const refreshToken = await this.signRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  async consumeRefreshToken(refreshToken: string): Promise<string> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findActiveByTokenId(
      payload.sub,
      payload.jti,
    );

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const matches = this.compareHash(refreshToken, tokenRecord.token_hash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    await this.refreshTokenRepository.revoke(payload.sub, payload.jti);
    return payload.sub;
  }

  private async signRefreshToken(userId: string): Promise<string> {
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
    await this.refreshTokenRepository.create({
      userId,
      tokenId,
      tokenHash: this.hashToken(token),
      expiresAt,
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
