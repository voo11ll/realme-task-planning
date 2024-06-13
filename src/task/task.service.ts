import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './task.schema';
import { User } from '../user/user.schema';
import { Project } from '../project/project.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async createTask(taskData: {
    title: string;
    description?: string;
    deadline?: Date;
    subtasks?: { title: string; isCompleted: boolean }[];
    status?: string;
    notes?: string;
    assigneeEmail?: string;
    projectId?: string;
    isPersonal?: boolean;
    viewType?: string; 
  }): Promise<Task> {
    const {
      title,
      description,
      deadline,
      subtasks,
      status,
      notes,
      assigneeEmail,
      projectId,
      isPersonal,
      viewType = 'backlog'
    } = taskData;

    let assignee: User | null = null;
    if (assigneeEmail) {
      assignee = await this.userModel.findOne({ email: assigneeEmail });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    if (projectId) {
      const project = await this.projectModel.findById(projectId);
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      if (assignee && !project.participants.includes(assignee._id)) {
        throw new NotFoundException('Assignee not in the project');
      }
    }

    const task = new this.taskModel({
      title,
      description,
      deadline,
      subtasks,
      status: status || 'ToDo',
      notes,
      assignee: assignee ? assignee._id : undefined,
      project: projectId ? new Types.ObjectId(projectId) : undefined,
      isPersonal: isPersonal || false,
      viewType 
    });

    return task.save();
  }

  async updateTask(taskId: string, updateData: {
    title?: string;
    description?: string;
    deadline?: Date;
    subtasks?: { title: string; isCompleted: boolean }[];
    status?: string;
    notes?: string;
    assigneeEmail?: string;
  }): Promise<Task> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (updateData.assigneeEmail) {
      const assignee = await this.userModel.findOne({ email: updateData.assigneeEmail });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
      if (task.project) {
        const project = await this.projectModel.findById(task.project);
        if (!project.participants.includes(assignee._id)) {
          throw new NotFoundException('Assignee not in the project');
        }
      }
      task.assignee = assignee._id;
    }

    Object.assign(task, updateData);
    return task.save();
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.taskModel.findByIdAndDelete(taskId);
  }

  async getProjectTasks(projectId: string, viewType: string): Promise<Task[]> {
    return this.taskModel.find({ project: new Types.ObjectId(projectId), viewType });
  }

  async getUserPersonalTasks(userId: string): Promise<Task[]> {
    return this.taskModel.find({ assignee: new Types.ObjectId(userId), isPersonal: true });
  }
}