import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserByIdCommand } from '@/modules/user/application/command';
import { UserRepository } from '@/modules/user/infrastructure/repository/user.repository';

@CommandHandler(UpdateUserByIdCommand)
export class UpdateUserHandler
  implements ICommandHandler<UpdateUserByIdCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserByIdCommand) {
    return await this.userRepository.update(command.userId, command.props);
  }
}
