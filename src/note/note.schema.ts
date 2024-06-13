import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Todo extends Document {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop()
  userId: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ type: [TodoSchema], _id: true })
  todos: Types.DocumentArray<Todo>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const NoteSchema = SchemaFactory.createForClass(Note);