import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './task.schema';
import { User } from '../user/user.schema';
import { Project } from '../project/project.schema';
import { CreateNoteDto } from '../note/dto/create-note.dto';
import { UpdateNoteDto } from '../note/dto/update-note.dto';
import { Note } from '../note/note.schema';

@Injectable()
export class TaskService {
  private defaultStatuses = ['backlog', 'done', 'in progress', 'todo'];

  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  private async validateStatus(projectId: string, status: string): Promise<void> {
    if (this.defaultStatuses.includes(status)) {
      return;
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.customStatuses || !project.customStatuses.includes(status)) {
      throw new BadRequestException(`Status '${status}' is not valid for project '${projectId}'`);
    }
  }

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
      status = 'backlog',
      notes,
      assigneeEmail,
      projectId,
      isPersonal,
      viewType = 'backlog',
    } = taskData;

    let assignee: User | null = null;
    if (assigneeEmail) {
      assignee = await this.userModel.findOne({ email: assigneeEmail });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    if (projectId) {
      await this.validateStatus(projectId, status);
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
      status,
      notes,
      assignee: assignee ? assignee.email : undefined,
      project: projectId ? new Types.ObjectId(projectId) : undefined,
      isPersonal: isPersonal || false,
      viewType,
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

    if (updateData.status) {
      await this.validateStatus(task.project.toString(), updateData.status);
    }

    if (updateData.assigneeEmail) {
      let assignee = await this.userModel.findOne({ email: updateData.assigneeEmail });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
      if (task.project) {
        const project = await this.projectModel.findById(task.project);
        if (!project.participants.includes(assignee._id)) {
          throw new NotFoundException('Assignee not in the project');
        }
      }
      assignee = User._id;
    }

    Object.assign(task, updateData);
    const updatedTask = await task.save();
    return this.populateTask(updatedTask);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.taskModel.findByIdAndDelete(taskId);
  }

  async getProjectTasks(projectId: string, viewType: string): Promise<any[]> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let statusFilter: any;

    if (viewType === 'kanban') {
      const kanbanStatuses = [...this.defaultStatuses, ...(project.customStatuses || [])].filter(status => status !== 'backlog');
      statusFilter = { $in: kanbanStatuses };
    } else {
      statusFilter = 'backlog';
    }

    const tasks = await this.taskModel.find({ project: new Types.ObjectId(projectId), status: statusFilter }).populate('assignee', 'email');
    return tasks.map(task => this.populateTask(task));
  }

  async getUserPersonalTasks(userId: string): Promise<any[]> {
    const tasks = await this.taskModel.find({ assignee: new Types.ObjectId(userId), isPersonal: true }).populate('assignee', 'email');
    return tasks.map(task => this.populateTask(task));
  }

  async createCustomStatus(projectId: string, status: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.customStatuses) {
      project.customStatuses = [];
    }

    project.customStatuses.push(status);
    await project.save();
  }

  async updateCustomStatus(projectId: string, oldStatus: string, newStatus: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const statusIndex = project.customStatuses.indexOf(oldStatus);
    if (statusIndex === -1) {
      throw new NotFoundException('Status not found');
    }

    project.customStatuses[statusIndex] = newStatus;
    await project.save();
  }

  async deleteCustomStatus(projectId: string, status: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.customStatuses = project.customStatuses.filter(s => s !== status);
    await project.save();
  }

  async getCustomStatuses(projectId: string): Promise<string[]> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project.customStatuses;
  }

  async addNoteToTask(taskId: string, createNoteDto: CreateNoteDto): Promise<any> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.notes.push(createNoteDto as Note);
    const savedTask = await task.save();
    return this.populateTask(savedTask);
  }

  async updateNoteInTask(taskId: string, noteId: string, updateNoteDto: UpdateNoteDto): Promise<any> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const note = task.notes.id(noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (updateNoteDto.title) {
      note.title = updateNoteDto.title;
    }
    if (updateNoteDto.description) {
      note.description = updateNoteDto.description;
    }
    if (updateNoteDto.todos) {
      updateNoteDto.todos.forEach(updatedTodo => {
        const todo = note.todos.id(updatedTodo._id);
        if (todo) {
          if (updatedTodo.title) {
            todo.title = updatedTodo.title;
          }
          if (updatedTodo.description) {
            todo.description = updatedTodo.description;
          }
          if (updatedTodo.isCompleted !== undefined) {
            todo.isCompleted = updatedTodo.isCompleted;
          }
        } else {
          note.todos.push(updatedTodo as any); // Convert DTO to Todo type
        }
      });
    }

    const savedTask = await task.save();
    return this.populateTask(savedTask);
  }

  async deleteNoteFromTask(taskId: string, noteId: string): Promise<any> {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const note = task.notes.id(noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    note.remove();
    const savedTask = await task.save();
    return this.populateTask(savedTask);
  }

  private async populateTask(task: any): Promise<any> {
    await task.populate('assignee', 'email').execPopulate();
    return task;
  }
}
