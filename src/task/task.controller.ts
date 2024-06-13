import { Controller, Post, Patch, Delete, Get, Body, Param, UseGuards, Request, Query, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('task')
@UseGuards(AuthGuard())
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() body: {
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
  }) {
    const task = await this.taskService.createTask(body);
    return { message: 'Task created successfully', task };
  }

  @Patch('/:id')
  async updateTask(@Param('id') taskId: string, @Body() body: {
    title?: string;
    description?: string;
    deadline?: Date;
    subtasks?: { title: string; isCompleted: boolean }[];
    status?: string;
    notes?: string;
    assigneeEmail?: string;
  }) {
    const task = await this.taskService.updateTask(taskId, body);
    return { message: 'Task updated successfully', task };
  }

  @Delete('/:id')
  async deleteTask(@Param('id') taskId: string) {
    await this.taskService.deleteTask(taskId);
    return { message: 'Task deleted successfully' };
  }

  @Get('/project/:projectId')
  async getProjectTasks(@Param('projectId') projectId: string, @Query('viewType') viewType: string) {
    const tasks = await this.taskService.getProjectTasks(projectId, viewType || 'backlog');
    return { tasks };
  }

  @Get('/personal')
  async getUserPersonalTasks(@Request() req: any) {
    const userId = req.user.id;
    const tasks = await this.taskService.getUserPersonalTasks(userId);
    return { tasks };
  }
}
