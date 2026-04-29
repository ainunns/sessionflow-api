import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';
@Schema()
export abstract class IdentityEntity {
  @Prop({
    type: String,
    default: () => new Types.ObjectId().toHexString(),
  })
  id!: string;
}
