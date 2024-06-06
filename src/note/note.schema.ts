import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Todo extends Document {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isCompleted: boolean;
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

  @Prop({ type: [TodoSchema], default: [] })
  todos: Types.DocumentArray<Todo>;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
