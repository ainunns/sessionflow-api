import { IRepository } from '@/common/interface/domain/repository.interface';
import { User } from '@/modules/user/domain/entity/user.entity';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}
