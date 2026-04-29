import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '@/modules/user/application/query';
import {
  ChangePasswordUseCase,
  UpdateUserUseCase,
} from '@/modules/user/application/use-case';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';
import {
  ChangePasswordRequestDto,
  UpdateUserByIdRequestDto,
} from '@/modules/user/presentation/dto/request';

@Injectable()
export class UserService {
  constructor(
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly queryBus: QueryBus,
    private readonly userMapper: UserMapper,
  ) {}

  async getProfile(userId: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userMapper.toResponse(user);
  }

  async updateUserById(
    userId: string,
    updateUserDto: UpdateUserByIdRequestDto,
  ) {
    return await this.updateUserUseCase.execute({
      userId,
      updateUserDto,
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordRequestDto,
  ) {
    return await this.changePasswordUseCase.execute({
      userId,
      changePasswordDto,
    });
  }
}
