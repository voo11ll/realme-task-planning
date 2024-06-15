// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';
// import { User } from '../user/user.schema';
// import { Project } from '../project/project.schema';

// export enum TaskStatus {
//   BACKLOG = 'backlog',
//   DONE = 'done',
//   IN_PROGRESS = 'in progress',
//   TODO = 'todo',
// }

// @Schema({
//   timestamps: true,
// })
// export class Task extends Document {
//   @Prop({ required: true })
//   title: string;

//   @Prop()
//   description: string;

//   @Prop()
//   deadline: Date;

//   @Prop([{ title: String, isCompleted: Boolean }])
//   subtasks: { title: string; isCompleted: boolean }[];

//   @Prop({ enum: TaskStatus, default: TaskStatus.TODO })
//   status: TaskStatus;

//   @Prop()
//   notes: string;

//   @Prop({ type: Types.ObjectId, ref: 'User' })
//   assignee: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'Project' })
//   project: Types.ObjectId; 

//   @Prop({ default: false })
//   isPersonal: boolean; 

//   @Prop({ default: 'backlog' }) 
//   viewType: string; 
// }

// export const TaskSchema = SchemaFactory.createForClass(Task);

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

  @Prop()
  status: string;  // Удаляем enum и делаем обычным строковым полем

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project: Types.ObjectId;

  @Prop({ default: false })
  isPersonal: boolean;

  @Prop({ default: 'backlog' })
  viewType: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
