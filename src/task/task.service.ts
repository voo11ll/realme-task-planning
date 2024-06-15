// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Task, TaskStatus } from './task.schema';
// import { User } from '../user/user.schema';
// import { Project } from '../project/project.schema';

// @Injectable()
// export class TaskService {
//   constructor(
//     @InjectModel(Task.name) private taskModel: Model<Task>,
//     @InjectModel(User.name) private userModel: Model<User>,
//     @InjectModel(Project.name) private projectModel: Model<Project>,
//   ) {}

//   async createTask(taskData: {
//     title: string;
//     description?: string;
//     deadline?: Date;
//     subtasks?: { title: string; isCompleted: boolean }[];
//     status?: string;
//     notes?: string;
//     assigneeEmail?: string;
//     projectId?: string;
//     isPersonal?: boolean;
//     viewType?: string; 
//   }): Promise<Task> {
//     const {
//       title,
//       description,
//       deadline,
//       subtasks,
//       status,
//       notes,
//       assigneeEmail,
//       projectId,
//       isPersonal,
//       viewType = 'backlog'
//     } = taskData;

//     let assignee: User | null = null;
//     if (assigneeEmail) {
//       assignee = await this.userModel.findOne({ email: assigneeEmail });
//       if (!assignee) {
//         throw new NotFoundException('Assignee not found');
//       }
//     }

//     if (projectId) {
//       const project = await this.projectModel.findById(projectId);
//       if (!project) {
//         throw new NotFoundException('Project not found');
//       }
//       if (assignee && !project.participants.includes(assignee._id)) {
//         throw new NotFoundException('Assignee not in the project');
//       }
//     }

//     const task = new this.taskModel({
//       title,
//       description,
//       deadline,
//       subtasks,
//       status: status || 'ToDo',
//       notes,
//       assignee: assignee ? assignee._id : undefined,
//       project: projectId ? new Types.ObjectId(projectId) : undefined,
//       isPersonal: isPersonal || false,
//       viewType 
//     });

//     return task.save();
//   }

//   async updateTask(taskId: string, updateData: {
//     title?: string;
//     description?: string;
//     deadline?: Date;
//     subtasks?: { title: string; isCompleted: boolean }[];
//     status?: string;
//     notes?: string;
//     assigneeEmail?: string;
//   }): Promise<Task> {
//     const task = await this.taskModel.findById(taskId);
//     if (!task) {
//       throw new NotFoundException('Task not found');
//     }

//     if (updateData.assigneeEmail) {
//       const assignee = await this.userModel.findOne({ email: updateData.assigneeEmail });
//       if (!assignee) {
//         throw new NotFoundException('Assignee not found');
//       }
//       if (task.project) {
//         const project = await this.projectModel.findById(task.project);
//         if (!project.participants.includes(assignee._id)) {
//           throw new NotFoundException('Assignee not in the project');
//         }
//       }
//       task.assignee = assignee._id;
//     }

//     Object.assign(task, updateData);
//     return task.save();
//   }

//   async deleteTask(taskId: string): Promise<void> {
//     await this.taskModel.findByIdAndDelete(taskId);
//   }

//   // async getProjectTasks(projectId: string, viewType: string): Promise<Task[]> {
//   //   return this.taskModel.find({ project: new Types.ObjectId(projectId), viewType });
//   // }

//   async getUserPersonalTasks(userId: string): Promise<Task[]> {
//     return this.taskModel.find({ assignee: new Types.ObjectId(userId), isPersonal: true });
//   }

//   async getProjectTasks(projectId: string, viewType: string): Promise<Task[]> {
//     if (viewType === 'kanban') {
//       return this.taskModel.find({
//         project: new Types.ObjectId(projectId),
//         status: { $in: [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO] },
//       });
//     } else if (viewType === 'backlog') {
//       return this.taskModel.find({
//         project: new Types.ObjectId(projectId),
//         status: TaskStatus.BACKLOG,
//       });
//     }
//     return [];
//   }

//   async createCustomStatus(projectId: string, status: string): Promise<void> {
//     const project = await this.projectModel.findById(projectId);
//     if (!project) {
//       throw new NotFoundException('Project not found');
//     }

//     if (status === TaskStatus.DONE || status === TaskStatus.IN_PROGRESS || status === TaskStatus.TODO) {
//       throw new Error('Cannot create predefined status');
//     }

//     if (!project.customStatuses) {
//       project.customStatuses = [];
//     }

//     project.customStatuses.push(status);
//     await project.save();
//   }

//   async updateCustomStatus(projectId: string, oldStatus: string, newStatus: string): Promise<void> {
//     const project = await this.projectModel.findById(projectId);
//     if (!project) {
//       throw new NotFoundException('Project not found');
//     }

//     if (oldStatus === TaskStatus.DONE || oldStatus === TaskStatus.IN_PROGRESS || oldStatus === TaskStatus.TODO) {
//       throw new Error('Cannot update predefined status');
//     }

//     const statusIndex = project.customStatuses.indexOf(oldStatus);
//     if (statusIndex === -1) {
//       throw new NotFoundException('Status not found');
//     }

//     project.customStatuses[statusIndex] = newStatus;
//     await project.save();
//   }

//   async deleteCustomStatus(projectId: string, status: string): Promise<void> {
//     const project = await this.projectModel.findById(projectId);
//     if (!project) {
//       throw new NotFoundException('Project not found');
//     }

//     if (status === TaskStatus.DONE || status === TaskStatus.IN_PROGRESS || status === TaskStatus.TODO) {
//       throw new Error('Cannot delete predefined status');
//     }

//     project.customStatuses = project.customStatuses.filter(s => s !== status);
//     await project.save();
//   }
// }

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './task.schema';
import { User } from '../user/user.schema';
import { Project } from '../project/project.schema';

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
      assignee: assignee ? assignee._id : undefined,
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

    return this.taskModel.find({ project: new Types.ObjectId(projectId), status: statusFilter });
  }

  async getUserPersonalTasks(userId: string): Promise<Task[]> {
    return this.taskModel.find({ assignee: new Types.ObjectId(userId), isPersonal: true });
  }

  async createCustomStatus(projectId: string, status: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // if (status === TaskStatus.DONE || status === TaskStatus.IN_PROGRESS || status === TaskStatus.TODO) {
    //   throw new Error('Cannot create predefined status');
    // }

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

    // if (oldStatus === TaskStatus.DONE || oldStatus === TaskStatus.IN_PROGRESS || oldStatus === TaskStatus.TODO) {
    //   throw new Error('Cannot update predefined status');
    // }

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

    // if (status === TaskStatus.DONE || status === TaskStatus.IN_PROGRESS || status === TaskStatus.TODO) {
    //   throw new Error('Cannot delete predefined status');
    // }

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

  // async getProjectUsers(projectId: string): Promise<User[]> {
  //   const project = await this.projectModel.findById(projectId).populate('participants');
  //   if (!project) {
  //     throw new NotFoundException('Project not found');
  //   }
  //   return project.participants;
  // }

}
