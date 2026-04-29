import { AggregateRoot } from '@nestjs/cqrs';
import { IBaseEntity } from '@/common/interface/domain/base-entity.interface';

export interface UserProps extends IBaseEntity {
  email: string;
  password: string;
}

export class User extends AggregateRoot {
  id: string;
  props: UserProps;

  constructor(id: string, props: UserProps) {
    super();
    this.id = id;
    this.props = props;
  }

  public getProps(): Partial<UserProps> {
    return this.props;
  }

  public getEmail(): string {
    return this.props.email;
  }

  public getPassword(): string {
    return this.props.password;
  }
}
