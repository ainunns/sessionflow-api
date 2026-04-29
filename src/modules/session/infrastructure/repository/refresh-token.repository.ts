import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { RefreshTokenEntity } from '@/modules/session/infrastructure/entity/refresh-token.schema';

export interface CreateRefreshTokenParams {
  userId: string;
  tokenId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenEntity.name)
    private readonly refreshTokenModel: Model<RefreshTokenEntity>,
  ) {}

  async create(params: CreateRefreshTokenParams): Promise<RefreshTokenEntity> {
    const created = await this.refreshTokenModel.create({
      user_id: params.userId,
      token_id: params.tokenId,
      token_hash: params.tokenHash,
      expires_at: params.expiresAt,
    });

    return created.toObject ? created.toObject() : created;
  }

  async findActiveByTokenId(
    userId: string,
    tokenId: string,
  ): Promise<RefreshTokenEntity | null> {
    const filter = {
      user_id: userId,
      token_id: tokenId,
      revoked_at: null,
      expires_at: { $gt: new Date() },
    } as FilterQuery<RefreshTokenEntity>;

    return await this.refreshTokenModel
      .findOne(filter)
      .lean<RefreshTokenEntity>()
      .exec();
  }

  async revoke(userId: string, tokenId: string): Promise<void> {
    const filter = {
      user_id: userId,
      token_id: tokenId,
      revoked_at: null,
    } as FilterQuery<RefreshTokenEntity>;

    await this.refreshTokenModel
      .findOneAndUpdate(filter, { revoked_at: new Date() })
      .exec();
  }
}
