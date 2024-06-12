import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project, ProjectSchema } from './project.schema';
import { User, UserSchema } from '../user/user.schema';
import { Task, TaskSchema } from '../task/task.schema'; 
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TaskService } from '../task/task.service'; 

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    AuthModule,
    UserModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, TaskService],
  exports: [ProjectService],
})
export class ProjectModule {}
