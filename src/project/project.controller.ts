import { Controller, Post, Patch, Delete, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('project')
@UseGuards(AuthGuard())
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

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
    const project = await this.projectService.addParticipant(projectId, participantEmail);
    return { message: 'Participant added successfully', project };
  }

  @Get('/user-projects')
  async getUserProjects(@Request() req: any) {
    const userId = req.user.id;
    const projects = await this.projectService.getUserProjects(userId);
    return { projects };
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
}
