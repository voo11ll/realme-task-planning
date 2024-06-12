import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { Project } from '../project/project.schema';

@Schema({
  timestamps: true,
})
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  deadline: Date;

  @Prop([{ title: String, isCompleted: Boolean }])
  subtasks: { title: string; isCompleted: boolean }[];

  @Prop({ default: 'ToDo' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project: Types.ObjectId; 

  @Prop({ default: false })
  isPersonal: boolean; 
}

export const TaskSchema = SchemaFactory.createForClass(Task);
