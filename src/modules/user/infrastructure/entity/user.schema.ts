import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DateTimeEntity } from '@/common/database/datetime.entity';

export type UserDocument = HydratedDocument<UserEntity>;

@Schema({
  collection: 'users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class UserEntity extends DateTimeEntity {
  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Prop({ type: String, required: true })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
