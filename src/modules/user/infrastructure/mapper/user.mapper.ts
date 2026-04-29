import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Mapper } from '@/common/interface/domain/mapper.interface';
import { User, type UserProps } from '@/modules/user/domain/entity/user.entity';
import { UserEntity } from '@/modules/user/infrastructure/entity/user.schema';

@Injectable()
export class UserMapper
  implements Mapper<User | Partial<UserProps>, UserEntity>
{
  toDomain(record: UserEntity): User {
    const rawId = (record as { _id?: Types.ObjectId | string })._id;
    const id = rawId ? rawId.toString() : '';

    return new User(id, {
      id,
      email: record.email,
      password: record.password,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at,
    });
  }

  toPersistence(entity: User | Partial<UserProps>): UserEntity {
    const props = entity instanceof User ? entity.props : entity;
    const record = new UserEntity();

    if (props?.id) {
      (record as { _id?: Types.ObjectId | string })._id = props.id;
    }

    if (props?.email !== undefined) {
      record.email = props.email;
    }
    if (props?.password !== undefined) {
      record.password = props.password;
    }
    if (props?.createdAt !== undefined) {
      record.created_at = props.createdAt;
    }
    if (props?.updatedAt !== undefined) {
      record.updated_at = props.updatedAt;
    }

    return record;
  }

  toResponse(entity: User) {
    const props = entity.props;

    return {
      id: entity.id,
      email: props.email,
      created_at: props.createdAt,
      updated_at: props.updatedAt,
    };
  }
}
