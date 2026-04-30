import { Injectable } from '@nestjs/common';
import { IUseCase } from '@/common/interface/domain/use-case.interface';
import { TokenService } from '@/modules/auth/application/service/token.service';
import { LogoutRequestDto } from '@/modules/auth/presentation/dto/request/logout.dto';

@Injectable()
export class LogoutUseCase implements IUseCase<LogoutRequestDto, null> {
  constructor(private readonly tokenService: TokenService) {}

  async execute(input: LogoutRequestDto): Promise<null> {
    await this.tokenService.revokeSession(input.refresh_token);
    return null;
  }
}
