import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IUseCase } from '@/common/interface/domain/use-case.interface';
import { BcryptService } from '@/modules/auth/infrastructure/bcrypt/bcrypt.service';
import { UpdateUserByIdCommand } from '@/modules/user/application/command';
import { GetUserByIdQuery } from '@/modules/user/application/query';
import { ChangePasswordRequestDto } from '@/modules/user/presentation/dto/request';

@Injectable()
export class ChangePasswordUseCase
  implements
    IUseCase<
      {
        userId: string;
        changePasswordDto: ChangePasswordRequestDto;
      },
      void
    >
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({
    userId,
    changePasswordDto,
  }: {
    userId: string;
    changePasswordDto: ChangePasswordRequestDto;
  }) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) {
      throw new NotFoundException('Invalid email or password');
    }

    const isPasswordValid = await this.bcryptService.compare(
      changePasswordDto.current_password,
      user.getPassword(),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const newPassword = await this.bcryptService.hash(
      changePasswordDto.new_password,
    );
    await this.commandBus.execute(
      new UpdateUserByIdCommand(userId, { password: newPassword }),
    );

    return;
  }
}
