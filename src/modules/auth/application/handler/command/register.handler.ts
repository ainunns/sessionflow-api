import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { RegisterCommand } from '@/modules/auth/application/command';
import { User } from '@/modules/user/domain/entity/user.entity';
import { UserRepository } from '@/modules/user/infrastructure/repository/user.repository';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: RegisterCommand) {
    const now = new Date();
    const user = new User(new Types.ObjectId().toHexString(), {
      id: '',
      email: command.email,
      password: command.password,
      createdAt: now,
      updatedAt: now,
    });

    return await this.userRepository.save(user);
  }
}
