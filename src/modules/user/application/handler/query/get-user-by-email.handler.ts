import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByEmailQuery } from '@/modules/user/application/query';
import { UserRepository } from '@/modules/user/infrastructure/repository/user.repository';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserByEmailQuery) {
    const result = await this.userRepository.findByEmail(query.email);
    return result;
  }
}
