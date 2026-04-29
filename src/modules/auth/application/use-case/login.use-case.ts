import { Injectable, UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { IUseCase } from '@/common/interface/domain/use-case.interface';
import {
  DeviceInfo,
  TokenService,
} from '@/modules/auth/application/service/token.service';
import { BcryptService } from '@/modules/auth/infrastructure/bcrypt/bcrypt.service';
import { LoginRequestDto } from '@/modules/auth/presentation/dto/request';
import { LoginResponseDto } from '@/modules/auth/presentation/dto/response';
import { GetUserByEmailQuery } from '@/modules/user/application/query';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';

@Injectable()
export class LoginUseCase
  implements IUseCase<LoginRequestDto, LoginResponseDto>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly userMapper: UserMapper,
    private readonly bcryptService: BcryptService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    input: LoginRequestDto,
    deviceInfo?: DeviceInfo,
  ): Promise<LoginResponseDto> {
    const user = await this.queryBus.execute(
      new GetUserByEmailQuery(input.email),
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.bcryptService.compare(
      input.password,
      user.getPassword(),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokenPair = await this.tokenService.issueTokenPair(
      user.id,
      user.getEmail(),
      deviceInfo,
    );

    return {
      user: this.userMapper.toResponse(user),
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
    };
  }
}
