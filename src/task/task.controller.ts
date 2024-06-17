import { Controller, Post, Patch, Delete, Get, Body, Param, UseGuards, Request, Query, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateNoteDto } from '../note/dto/create-note.dto';
import { UpdateNoteDto } from '../note/dto/update-note.dto';

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

  @Post('/custom-status/:projectId')
  async createCustomStatus(@Param('projectId') projectId: string, @Body('status') status: string) {
    await this.taskService.createCustomStatus(projectId, status);
    return { message: 'Custom status created successfully' };
  }

  @Patch('/custom-status/:projectId')
  async updateCustomStatus(@Param('projectId') projectId: string, @Body() body: { oldStatus: string, newStatus: string }) {
    await this.taskService.updateCustomStatus(projectId, body.oldStatus, body.newStatus);
    return { message: 'Custom status updated successfully' };
  }

  @Delete('/custom-status/:projectId')
  async deleteCustomStatus(@Param('projectId') projectId: string, @Body('status') status: string) {
    await this.taskService.deleteCustomStatus(projectId, status);
    return { message: 'Custom status deleted successfully' };
  }

  @Get('/custom-status/:projectId')
  async getCustomStatuses(@Param('projectId') projectId: string) {
    const statuses = await this.taskService.getCustomStatuses(projectId);
    return { statuses };
  }

  @Post('/:taskId/note')
  async addNoteToTask(
    @Param('taskId') taskId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    const task = await this.taskService.addNoteToTask(taskId, createNoteDto);
    return { message: 'Note added to task successfully', task };
  }

  @Patch('/:taskId/note/:noteId')
  async updateNoteInTask(
    @Param('taskId') taskId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    const task = await this.taskService.updateNoteInTask(taskId, noteId, updateNoteDto);
    return { message: 'Note updated successfully', task };
  }

  @Delete('/:taskId/note/:noteId')
  async deleteNoteFromTask(
    @Param('taskId') taskId: string,
    @Param('noteId') noteId: string,
  ) {
    const task = await this.taskService.deleteNoteFromTask(taskId, noteId);
    return { message: 'Note deleted successfully', task };
  }

  @Patch('/:taskId/status')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body('status') status: string,
  ) {
    const task = await this.taskService.updateTaskStatus(taskId, status);
    return { message: 'Task status updated successfully', task };
}
}
