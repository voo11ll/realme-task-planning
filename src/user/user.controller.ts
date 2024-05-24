// user.controller.ts
import { Controller, Get, UseGuards, Request, Body, Patch, Delete, Post, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from './user.schema';
import { NotFoundException } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard())
  @Get('/profile')
  async getProfile(@Request() req: any): Promise<{ name: string, email: string }> {
    const userId = req.user.id;
    const user = await this.userService.getUserProfile(userId);

    return {
      name: user.name,
      email: user.email,
    };
  }

  @UseGuards(AuthGuard())
  @Patch('/profile')
  async updateProfile(@Request() req: any, @Body() updateData: { name?: string, newPassword?: string }): Promise<{ message: string }> {
    const userId = req.user.id;
    const result = await this.userService.updateProfile(userId, updateData);
    return result;
  }

  @UseGuards(AuthGuard())
  @Delete('/profile')
  async deleteProfile(@Request() req: any): Promise<{ message: string }> {
    const userId = req.user.id;
    const result = await this.userService.deleteProfile(userId);
    return result;
  }

  @UseGuards(AuthGuard())
  @Post('/logout')
  async logout(@Request() req: any): Promise<{ message: string }> {
    const result = await this.userService.logout(req.user.id);
    return result;
  }
  @Get('/email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
