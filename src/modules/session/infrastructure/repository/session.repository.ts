import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICollection } from '@/common/interface/presentation/collection.interface';
import { SessionEntity } from '@/modules/session/infrastructure/schema/session.schema';

export interface CreateSessionParams {
  userId: string;
  tokenId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RotateTokenParams {
  userId: string;
  oldTokenId: string;
  newTokenId: string;
  newTokenHash: string;
  newExpiresAt: Date;
  lastUsedAt: Date;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionRepository {
  constructor(
    @InjectModel(SessionEntity.name)
    private readonly sessionModel: Model<SessionEntity>,
  ) {}

  async create(params: CreateSessionParams): Promise<SessionEntity> {
    const session = await this.sessionModel.create({
      user_id: params.userId,
      token_id: params.tokenId,
      token_hash: params.tokenHash,
      expires_at: params.expiresAt,
      device_type: params.deviceType,
      device_name: params.deviceName,
      browser: params.browser,
      os: params.os,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      last_used_at: new Date(),
      is_active: true,
    });
    return session.toObject();
  }

  async findActiveByTokenId(
    userId: string,
    tokenId: string,
  ): Promise<SessionEntity | null> {
    return await this.sessionModel
      .findOne({
        user_id: userId,
        token_id: tokenId,
        revoked_at: null,
        expires_at: { $gt: new Date() },
      })
      .lean()
      .exec();
  }

  async findActiveByUserId(
    userId: string,
    page: number,
    perPage: number,
  ): Promise<ICollection<SessionEntity>> {
    const filter = {
      user_id: userId,
      revoked_at: null,
      expires_at: { $gt: new Date() },
    };
    const [items, total] = await Promise.all([
      this.sessionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
        .exec(),
      this.sessionModel.countDocuments(filter),
    ]);
    return { items, total };
  }

  async revokeByTokenId(userId: string, tokenId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { user_id: userId, token_id: tokenId, revoked_at: null },
      { revoked_at: new Date(), is_active: false },
    );
  }

  async rotateToken(params: RotateTokenParams): Promise<SessionEntity | null> {
    return await this.sessionModel
      .findOneAndUpdate(
        {
          user_id: params.userId,
          token_id: params.oldTokenId,
          revoked_at: null,
        },
        {
          token_id: params.newTokenId,
          token_hash: params.newTokenHash,
          expires_at: params.newExpiresAt,
          last_used_at: params.lastUsedAt,
          device_type: params.deviceType,
          device_name: params.deviceName,
          browser: params.browser,
          os: params.os,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
          is_active: true,
          revoked_at: null,
        },
        { new: true },
      )
      .lean()
      .exec();
  }
}
