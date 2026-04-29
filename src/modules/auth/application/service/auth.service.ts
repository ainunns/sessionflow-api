import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DeviceInfo } from '@/modules/auth/application/service/token.service';
import {
  LoginUseCase,
  RefreshUseCase,
  RegisterUseCase,
} from '@/modules/auth/application/use-case';
import {
  LoginRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
} from '@/modules/auth/presentation/dto/request';
import { GetUserByIdQuery } from '@/modules/user/application/query';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly userMapper: UserMapper,
    private readonly queryBus: QueryBus,
  ) {}

  async login(loginDto: LoginRequestDto, deviceInfo?: DeviceInfo) {
    return await this.loginUseCase.execute(loginDto, deviceInfo);
  }

  async register(registerDto: RegisterRequestDto) {
    return await this.registerUseCase.execute(registerDto);
  }

  async refresh(refreshDto: RefreshRequestDto, deviceInfo?: DeviceInfo) {
    return await this.refreshUseCase.execute(refreshDto, deviceInfo);
  }

  async me(userId: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userMapper.toResponse(user);
  }
}
