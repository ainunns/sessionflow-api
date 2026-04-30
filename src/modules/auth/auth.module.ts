import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RegisterHandler } from '@/modules/auth/application/handler';
import { AuthService } from '@/modules/auth/application/service/auth.service';
import { TokenService } from '@/modules/auth/application/service/token.service';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshUseCase,
  RegisterUseCase,
} from '@/modules/auth/application/use-case';
import { BcryptService } from '@/modules/auth/infrastructure/bcrypt/bcrypt.service';
import { JwtStrategy } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { AuthController } from '@/modules/auth/presentation/controller/auth.controller';
import { AuthGuard } from '@/modules/auth/presentation/guard/auth.guard';
import { SessionModule } from '@/modules/session/session.module';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    UserModule,
    SessionModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number.parseInt(
            config.get('JWT_EXPIRES_IN') ?? '3600',
            10,
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginUseCase,
    LogoutUseCase,
    RegisterUseCase,
    RefreshUseCase,
    RegisterHandler,
    UserMapper,
    BcryptService,
    TokenService,
    JwtStrategy,
    AuthGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
