import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DateTimeEntity } from '@/common/database/datetime.entity';

export type SessionDocument = HydratedDocument<SessionEntity>;

@Schema({
  collection: 'sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class SessionEntity extends DateTimeEntity {
  @Prop({ type: String, required: true, index: true })
  user_id!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  token_id!: string;

  @Prop({ type: String, required: true })
  token_hash!: string;

  @Prop({ type: String, required: false })
  device_type?: string;

  @Prop({ type: String, required: false })
  device_name?: string;

  @Prop({ type: String, required: false })
  browser?: string;

  @Prop({ type: String, required: false })
  os?: string;

  @Prop({ type: String, required: false })
  ip_address?: string;

  @Prop({ type: String, required: false })
  user_agent?: string;

  @Prop({ type: Date, required: true, index: true })
  expires_at!: Date;

  @Prop({ type: Date, default: null })
  last_used_at?: Date;

  @Prop({ type: Boolean, default: true })
  is_active!: boolean;

  @Prop({ type: Date, default: null })
  revoked_at?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(SessionEntity);
