import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '@/modules/auth/application/service/auth.service';
import type { JwtPayload } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { CurrentUser } from '@/modules/auth/presentation/decorator/current-user.decorator';
import {
  LoginRequestDto,
  RegisterRequestDto,
} from '@/modules/auth/presentation/dto/request';
import { AuthGuard } from '@/modules/auth/presentation/guard/auth.guard';
import { UserService } from '@/modules/user/application/service/user.service';
import { ChangePasswordRequestDto } from '@/modules/user/presentation/dto/request';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  async login(@Body() loginDto: LoginRequestDto) {
    const result = await this.authService.login(loginDto);
    return { message: 'Login successful', data: result };
  }

  @Post('register')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async register(@Body() registerDto: RegisterRequestDto) {
    const result = await this.authService.register(registerDto);
    return { message: 'Registration successful', data: result };
  }

  @Put('change-password')
  @UseGuards(AuthGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ) {
    await this.userService.changePassword(user.sub, changePasswordDto);
    return { message: 'Password changed successfully', data: null };
  }
}
