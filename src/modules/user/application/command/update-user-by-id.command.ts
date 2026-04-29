import { ICommand } from '@nestjs/cqrs';
import { UserProps } from '@/modules/user/domain/entity/user.entity';

export class UpdateUserByIdCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly props: Partial<UserProps>,
  ) {}
}
