import { Prop, Schema } from '@nestjs/mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export abstract class DateTimeEntity {
  @Prop({ type: Date })
  created_at!: Date;

  @Prop({ type: Date })
  updated_at!: Date;

  @Prop({ type: Date, default: null })
  deleted_at?: Date;
}
