import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop()
  name: string;

  @Prop({ unique: [true, 'Duplicate email entered'] })
  email: string;

  @Prop()
  password: string;

  @Prop()
  verificationCode: string;

  @Prop()
  isVerified: boolean;

  @Prop()
  token: string; // Добавьте свойство token
  static _id: User & { _id: import("mongoose").Types.ObjectId; };
}

export const UserSchema = SchemaFactory.createForClass(User);
