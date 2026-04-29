import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { IUseCase } from '@/common/interface/domain/use-case.interface';
import { UpdateUserByIdCommand } from '@/modules/user/application/command';
import { User } from '@/modules/user/domain/entity/user.entity';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';
import { UserRepository } from '@/modules/user/infrastructure/repository/user.repository';
import { UpdateUserByIdRequestDto } from '@/modules/user/presentation/dto/request';
import { GetUserResponseDto } from '@/modules/user/presentation/dto/response';

@Injectable()
export class UpdateUserUseCase
  implements
    IUseCase<
      {
        userId: string;
        updateUserDto: UpdateUserByIdRequestDto;
      },
      GetUserResponseDto
    >
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly userMapper: UserMapper,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({
    userId,
    updateUserDto,
  }: {
    userId: string;
    updateUserDto: UpdateUserByIdRequestDto;
  }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Invalid user id');
    }

    const existingEmailUser = await this.userRepository.findByEmail(
      updateUserDto.email,
    );
    if (existingEmailUser) {
      throw new NotFoundException('Email already in use');
    }

    const updatedUser: User = await this.commandBus.execute(
      new UpdateUserByIdCommand(userId, updateUserDto),
    );

    return this.userMapper.toResponse(updatedUser);
  }
}
