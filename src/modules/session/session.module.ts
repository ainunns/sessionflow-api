import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionRepository } from '@/modules/session/infrastructure/repository/session.repository';
import {
  SessionEntity,
  SessionSchema,
} from '@/modules/session/infrastructure/schema/session.schema';
import { SessionController } from '@/modules/session/presentation/controller/session.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SessionEntity.name, schema: SessionSchema },
    ]),
  ],
  controllers: [SessionController],
  providers: [SessionRepository],
  exports: [SessionRepository],
})
export class SessionModule {}
