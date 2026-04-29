import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginatedQueryParamsDto } from '@/common/dto/paginated-query-params.dto';
import { toPaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import type { JwtPayload } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { CurrentUser } from '@/modules/auth/presentation/decorator/current-user.decorator';
import { AuthGuard } from '@/modules/auth/presentation/guard/auth.guard';
import { SessionRepository } from '@/modules/session/infrastructure/repository/session.repository';
import { toSessionResponseDto } from '@/modules/session/presentation/dto/response/session.dto';

@UseGuards(AuthGuard)
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionRepository: SessionRepository) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginatedQueryParamsDto,
  ) {
    const collection = await this.sessionRepository.findActiveByUserId(
      user.sub,
      query.page,
      query.per_page,
    );
    const mapped = {
      items: collection.items.map(toSessionResponseDto),
      total: collection.total,
    };
    return toPaginatedResponseDto(mapped, query.page, query.per_page);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: JwtPayload,
    @Param('id') tokenId: string,
  ): Promise<void> {
    await this.sessionRepository.revokeByTokenId(user.sub, tokenId);
  }
}
