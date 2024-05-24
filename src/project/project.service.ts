import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './project.schema';
import { User } from '../user/user.schema';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createProject(name: string, participantEmails: string[]): Promise<Project> {
    const participants = await this.userModel.find({ email: { $in: participantEmails } });

    const project = new this.projectModel({
      name,
      participants: participants.map(participant => participant._id),
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

  async addParticipant(projectId: string, participantEmail: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const participant = await this.userModel.findOne({ email: participantEmail });
    if (!participant) {
      throw new NotFoundException('User not found');
    }

    project.participants.push(participant._id);

    return project.save();
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return this.projectModel.find({ participants: userId }).populate('participants', 'name email');
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
    await this.projectModel.findByIdAndDelete(projectId);
  }
}