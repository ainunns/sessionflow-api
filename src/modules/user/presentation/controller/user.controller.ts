import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { JwtPayload } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { CurrentUser } from '@/modules/auth/presentation/decorator/current-user.decorator';
import { AuthGuard } from '@/modules/auth/presentation/guard/auth.guard';
import { UserService } from '@/modules/user/application/service/user.service';
import { UpdateUserByIdRequestDto } from '@/modules/user/presentation/dto/request';

@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  async me(@CurrentUser() user: JwtPayload) {
    const result = await this.userService.getProfile(user.sub);
    return { message: 'User fetched successfully', data: result };
  }

  @Put()
  @UseGuards(AuthGuard)
  @Throttle({
    default: {
      limit: 20,
      ttl: 60_000,
    },
  })
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserByIdRequestDto,
  ) {
    const result = await this.userService.updateUserById(
      user.sub,
      updateUserDto,
    );
    return { message: 'User updated successfully', data: result };
  }
}
