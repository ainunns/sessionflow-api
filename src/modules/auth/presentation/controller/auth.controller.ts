import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { AuthService } from '@/modules/auth/application/service/auth.service';
import { DeviceInfo } from '@/modules/auth/application/service/token.service';
import type { JwtPayload } from '@/modules/auth/infrastructure/jwt/jwt.strategy';
import { CurrentUser } from '@/modules/auth/presentation/decorator/current-user.decorator';
import {
  LoginRequestDto,
  LogoutRequestDto,
  RefreshRequestDto,
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

  private extractDeviceInfo(req: Request, deviceName?: string): DeviceInfo {
    const ua = req.headers['user-agent'] ?? '';
    const parser = new UAParser(ua);
    const browser = parser.getBrowser().name;
    const os = parser.getOS().name;
    const rawDeviceType = parser.getDevice().type;
    const deviceType = rawDeviceType ?? 'desktop';
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      (Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded?.split(',')[0]?.trim()) ?? req.ip;
    return {
      browser,
      os,
      deviceType,
      ipAddress,
      userAgent: ua || undefined,
      deviceName,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginRequestDto, @Req() req: Request) {
    const deviceInfo = this.extractDeviceInfo(req);
    const data = await this.authService.login(loginDto, deviceInfo);
    return { message: 'Login successful', data };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterRequestDto) {
    const data = await this.authService.register(registerDto);
    return { message: 'Registration successful', data };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshRequestDto, @Req() req: Request) {
    const deviceInfo = this.extractDeviceInfo(req);
    const data = await this.authService.refresh(refreshDto, deviceInfo);
    return { message: 'Token refreshed', data };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() logoutDto: LogoutRequestDto) {
    const data = await this.authService.logout(logoutDto);
    return { message: 'Logout successful', data };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ) {
    await this.userService.changePassword(user.sub, changePasswordDto);
    const data = null;
    return { message: 'Password changed successfully', data };
  }
}
