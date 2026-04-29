import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DateTimeEntity } from '@/common/database/datetime.entity';

export type RefreshTokenDocument = HydratedDocument<RefreshTokenEntity>;

@Schema({
  collection: 'refresh_tokens',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RefreshTokenEntity extends DateTimeEntity {
  @Prop({ type: String, required: true, index: true })
  user_id!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  token_id!: string;

  @Prop({ type: String, required: true })
  token_hash!: string;

  @Prop({ type: Date, required: true, index: true })
  expires_at!: Date;

  @Prop({ type: Date, default: null })
  revoked_at?: Date;
}

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshTokenEntity);
