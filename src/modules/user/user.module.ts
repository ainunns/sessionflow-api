import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { BcryptService } from '@/modules/auth/infrastructure/bcrypt/bcrypt.service';
import { UpdateUserHandler } from '@/modules/user/application/handler/command';
import {
  GetUserByEmailHandler,
  GetUserByIdHandler,
} from '@/modules/user/application/handler/query';
import { UserService } from '@/modules/user/application/service/user.service';
import {
  ChangePasswordUseCase,
  UpdateUserUseCase,
} from '@/modules/user/application/use-case';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';
import { UserRepository } from '@/modules/user/infrastructure/repository/user.repository';
import {
  UserEntity,
  UserSchema,
} from '@/modules/user/infrastructure/schema/user.schema';
import { UserController } from '@/modules/user/presentation/controller/user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    CqrsModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UpdateUserUseCase,
    ChangePasswordUseCase,
    UserMapper,
    UserRepository,
    UpdateUserHandler,
    GetUserByEmailHandler,
    GetUserByIdHandler,
    BcryptService,
  ],
  exports: [UserRepository, UserMapper, UserService],
})
export class UserModule {}
