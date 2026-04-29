import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { IUseCase } from '@/common/interface/domain/use-case.interface';
import { TokenService } from '@/modules/auth/application/service/token.service';
import { RefreshRequestDto } from '@/modules/auth/presentation/dto/request/refresh.dto';
import { RefreshResponseDto } from '@/modules/auth/presentation/dto/response/refresh.dto';
import { GetUserByIdQuery } from '@/modules/user/application/query';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';

@Injectable()
export class RefreshUseCase
  implements IUseCase<RefreshRequestDto, RefreshResponseDto>
{
  constructor(
    private readonly tokenService: TokenService,
    private readonly queryBus: QueryBus,
    private readonly userMapper: UserMapper,
  ) {}

  async execute(input: RefreshRequestDto): Promise<RefreshResponseDto> {
    const userId = await this.tokenService.consumeRefreshToken(
      input.refresh_token,
    );

    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokenPair = await this.tokenService.issueTokenPair(
      userId,
      user.getEmail(),
    );

    return {
      user: this.userMapper.toResponse(user),
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
    };
  }
}
