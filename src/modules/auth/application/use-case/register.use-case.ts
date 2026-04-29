import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IUseCase } from '@/common/interface/domain/use-case.interface';
import { RegisterCommand } from '@/modules/auth/application/command';
import { BcryptService } from '@/modules/auth/infrastructure/bcrypt/bcrypt.service';
import { RegisterRequestDto } from '@/modules/auth/presentation/dto/request';
import { RegisterResponseDto } from '@/modules/auth/presentation/dto/response';
import { GetUserByEmailQuery } from '@/modules/user/application/query';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';

@Injectable()
export class RegisterUseCase
  implements IUseCase<RegisterRequestDto, RegisterResponseDto>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly userMapper: UserMapper,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(input: RegisterRequestDto) {
    const existing = await this.queryBus.execute(
      new GetUserByEmailQuery(input.email),
    );

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const password = await this.bcryptService.hash(input.password);
    const user = await this.commandBus.execute(
      new RegisterCommand(input.email, password),
    );

    return this.userMapper.toResponse(user);
  }
}
