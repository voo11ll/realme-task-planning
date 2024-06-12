import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './project.schema';
import { User } from '../user/user.schema';
import { Task } from '../task/task.schema';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  async createProject(name: string, participantEmails: string[]): Promise<Project> {
    const participants = await this.userModel.find({ email: { $in: participantEmails } });

    const project = new this.projectModel({
      name,
      participants: participants.map(participant => participant._id),
      tasks: [],
    });

    return project.save();
  }

  async updateProject(projectId: string, name: string, participantEmails: string[]): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const participants = await this.userModel.find({ email: { $in: participantEmails } });

    project.name = name;
    project.participants = participants.map(participant => participant._id);

    return project.save();
  }

  async addParticipant(projectId: string, user: User): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.participants.includes(user._id)) {
      project.participants.push(user._id);
    }

    return project.save();
  }

  async getProjectById(projectId: string): Promise<Project> {
    return this.projectModel.findById(projectId).populate('participants', 'name email').populate('tasks');
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return this.projectModel.find({ participants: userId }).populate('participants', 'name email').populate('tasks');
  }
  async getUserProjectsWithTasks(userId: string): Promise<any[]> {
    const projects = await this.projectModel.find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name email')
      .lean(); 

    const projectsWithTasks = await Promise.all(projects.map(async (project) => {
      const tasks = await this.taskModel.find({ project: project._id });
      return {
        ...project,
        tasks,
      };
    }));

    return projectsWithTasks;
  }

  async removeParticipant(projectId: string, participantEmail: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const participant = await this.userModel.findOne({ email: participantEmail });
    if (!participant) {
      throw new NotFoundException('User not found');
    }

    project.participants = project.participants.filter(
      participantId => !participantId.equals(participant._id),
    );

    return project.save();
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.taskModel.deleteMany({ project: new Types.ObjectId(projectId) });
    await this.projectModel.findByIdAndDelete(new Types.ObjectId(projectId));
  }

  async addTaskToProject(projectId: string, taskId: Types.ObjectId): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.tasks.push(taskId);
    return project.save();
  }

  async removeTaskFromProject(projectId: string, taskId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.tasks = project.tasks.filter(task => task.toString() !== taskId);
    return project.save();
  }
}
