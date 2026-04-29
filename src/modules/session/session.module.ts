import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefreshTokenEntity,
  RefreshTokenSchema,
} from '@/modules/session/infrastructure/entity/refresh-token.schema';
import { RefreshTokenRepository } from '@/modules/session/infrastructure/repository/refresh-token.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshTokenEntity.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [RefreshTokenRepository],
  exports: [RefreshTokenRepository],
})
export class SessionModule {}
