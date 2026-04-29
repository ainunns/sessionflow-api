import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ICollection } from '@/common/interface/presentation/collection.interface';
import { User, UserProps } from '@/modules/user/domain/entity/user.entity';
import { IUserRepository } from '@/modules/user/domain/repository/user.repository';
import { UserEntity } from '@/modules/user/infrastructure/entity/user.schema';
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async save(entity: User): Promise<User> {
    const savedEntity = await this.userModel.create(
      this.mapper.toPersistence(entity),
    );
    const persistence = savedEntity.toObject
      ? savedEntity.toObject()
      : savedEntity;
    return this.mapper.toDomain(persistence as UserEntity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const filter = { email, deleted_at: null } as FilterQuery<UserEntity>;
    const user = await this.userModel.findOne(filter).lean<UserEntity>().exec();
    return user ? this.mapper.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const filter = { _id: id, deleted_at: null } as FilterQuery<UserEntity>;
    const user = await this.userModel.findOne(filter).lean<UserEntity>().exec();
    return user ? this.mapper.toDomain(user) : null;
  }

  async findAll(): Promise<ICollection<User>> {
    const filter = { deleted_at: null } as FilterQuery<UserEntity>;
    const [items, total] = await Promise.all([
      this.userModel.find(filter).lean<UserEntity[]>().exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);
    return {
      items: items.map(this.mapper.toDomain),
      total,
    };
  }

  async update(id: string, props: Partial<UserProps>): Promise<User> {
    const filter = { _id: id, deleted_at: null } as FilterQuery<UserEntity>;
    const updated = await this.userModel
      .findOneAndUpdate(filter, this.mapper.toPersistence(props), { new: true })
      .lean<UserEntity>()
      .exec();

    if (!updated) throw new Error(`User not found`);

    return this.mapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const filter = { _id: id, deleted_at: null } as FilterQuery<UserEntity>;
    const deleted = await this.userModel
      .findOneAndUpdate(filter, { deleted_at: new Date() })
      .exec();
    if (!deleted) throw new Error(`User not found`);
  }
}
