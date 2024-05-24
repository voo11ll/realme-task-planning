// user.service.ts
import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
      ) {}

      async getUserProfile(userId: string): Promise<User> {
        const user = await this.userModel.findById(userId);
      
        if (!user) {
          throw new NotFoundException('User not found');
        } 
      
        return user;
      }
    
      async updateProfile(userId: string, updateData: { name?: string, newPassword?: string }): Promise<{ message: string }> {
        const user = await this.userModel.findById(userId);
      
        if (!user) {
          throw new NotFoundException('User not found');
        }
      
        if (updateData.name) {
          user.name = updateData.name;
        }
        if (updateData.newPassword) {
          user.password = updateData.newPassword;
        }
      
        await user.save();
    
        return { message: 'Profile updated successfully' };
      }

      async getUserByEmail(email: string): Promise<User> {
        return this.userModel.findOne({ email });
      }

      async deleteProfile(userId: string): Promise<{ message: string }> {
        const user = await this.userModel.findByIdAndDelete(userId);
      
        if (!user) {
          throw new NotFoundException('User not found');
        }
      
        return { message: 'Profile deleted successfully' };
      }

      async logout(userId: string): Promise<{ message: string }> {
        // Предположим, что у пользователя есть поле, где хранится токен доступа, например, token
        const user = await this.userModel.findById(userId);
      
        if (!user) {
          throw new NotFoundException('User not found');
        }
    
        // Очищаем поле токена доступа пользователя
        user.token = null;
        await user.save();
    
        return { message: 'Logout successful' };
    }
}
