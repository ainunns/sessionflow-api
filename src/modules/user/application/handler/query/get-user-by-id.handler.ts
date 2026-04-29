import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '@/modules/user/application/query';
import { UserRepository } from '@/modules/user/infrastructure/repository/user.repository';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserByIdQuery) {
    return await this.userRepository.findById(query.id);
  }
}
