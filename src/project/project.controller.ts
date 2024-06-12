import { Controller, Post, Patch, Delete, Get, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { TaskService } from '../task/task.service';
import { UserService } from '../user/user.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('project')
@UseGuards(AuthGuard())
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async createProject(@Body() body: { name: string; participantEmails: string[] }) {
    const { name, participantEmails } = body;
    const project = await this.projectService.createProject(name, participantEmails);
    return { message: 'Project created successfully', project };
  }

  @Patch('/:id')
  async updateProject(@Param('id') projectId: string, @Body() body: { name: string; participantEmails: string[] }) {
    const { name, participantEmails } = body;
    const project = await this.projectService.updateProject(projectId, name, participantEmails);
    return { message: 'Project updated successfully', project };
  }

  @Post('/:id/participant')
  async addParticipant(@Param('id') projectId: string, @Body() body: { participantEmail: string }) {
    const { participantEmail } = body;
    const user = await this.userService.getUserByEmail(participantEmail);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const project = await this.projectService.addParticipant(projectId, user);
    return { message: 'Participant added successfully', project };
  }

  @Get('/user-projects')
  async getUserProjects(@Request() req: any) {
    const userId = req.user.id;
    const projects = await this.projectService.getUserProjectsWithTasks(userId);
    return { projects };
  }


  @Get('/:id')
  async getProjectById(@Param('id') projectId: string) {
    const project = await this.projectService.getProjectById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Delete('/:id/participant')
  async removeParticipant(@Param('id') projectId: string, @Body() body: { participantEmail: string }) {
    const { participantEmail } = body;
    const project = await this.projectService.removeParticipant(projectId, participantEmail);
    return { message: 'Participant removed successfully', project };
  }

  @Delete('/:id')
  async deleteProject(@Param('id') projectId: string) {
    await this.projectService.deleteProject(projectId);
    return { message: 'Project deleted successfully' };
  }

  @Post('/:id/task')
  async createProjectTask(
    @Param('id') projectId: string,
    @Body() body: { title: string; description: string; deadline?: Date; subtasks?: { title: string; isCompleted: boolean }[]; status?: string; notes?: string; assigneeId?: string }
  ) {
    const task = await this.taskService.createTask({ ...body, projectId });
    const project = await this.projectService.addTaskToProject(projectId, task._id);
    return { message: 'Task created successfully', task, project };
  }

  @Patch('/:projectId/task/:taskId')
  async updateProjectTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: { title?: string; description?: string; deadline?: Date; subtasks?: { title: string; isCompleted: boolean }[]; status?: string; notes?: string; assigneeId?: string }
  ) {
    const task = await this.taskService.updateTask(taskId, body);
    return { message: 'Task updated successfully', task };
  }

  @Delete('/:projectId/task/:taskId')
  async deleteProjectTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ) {
    await this.taskService.deleteTask(taskId);
    await this.projectService.removeTaskFromProject(projectId, taskId);
    return { message: 'Task deleted successfully' };
  }

  @Get('/:projectId/tasks')
  async getProjectTasks(@Param('projectId') projectId: string) {
    const tasks = await this.taskService.getProjectTasks(projectId);
    return { tasks };
  }
}
