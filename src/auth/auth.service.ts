import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ message: string, statusCode: number, token?: string }> {
    const { name, email, password } = signUpDto;
    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return { message: 'Email is already registered and verified.', statusCode: 400 };
      }

      // Пользователь существует, но не верифицирован      
      // Обновляем все поля, кроме email
      const verificationCode = generateVerificationCode();
      const hashedPassword = await bcrypt.hash(password, 10);

      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.verificationCode = verificationCode;
      existingUser.isVerified = false;
      
      await existingUser.save();
      // Можно отправить новое письмо с кодом подтверждения
      await this.sendVerificationEmail(existingUser.email, verificationCode);

      return { message: 'Email already registered. New verification code sent.', statusCode: 201 };
    }

    // Пользователь не существует или уже верифицирован, создаем нового пользователя

    const verificationCode = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        verificationCode,
        isVerified: false,
      });

// Отправляем код подтверждения на электронную почту
      await this.sendVerificationEmail(user.email, verificationCode);

      const token = this.jwtService.sign({ id: user._id });

      return { message: 'Registration completed successfully', statusCode: 201, token };
    } catch (error) {
      console.error('Error during sign-up:', error);
      return { message: 'Error: Registration failed', statusCode: 500 };
    }
  }  

  async login(loginDto: LoginDto): Promise<{ token: string, statusCode: number }> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account not verified');
    }
    
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ id: user._id });

    return { token, statusCode: 201 };
  }

  async verifyAccount(email: string, verificationCode: string): Promise<{ message: string, statusCode: number }> {
    const user = await this.userModel.findOne({ email, verificationCode }).exec();

    if (!user) {
      throw new NotFoundException('Invalid verification code');
    }

// Помечаем аккаунт как активированный
    user.isVerified = true;
    await user.save();
    
    return { message: 'Email validate successful', statusCode: 201 }; // 201 - Created
  }catch (error) {
      console.error('Error during sign-up:', error);
      return { message: 'Error: Email not validated', statusCode: 500 }; // 500 - Internal Server Error
  }

  async resendVerificationCode(email: string): Promise<{ message: string, statusCode: number }> {
    const user = await this.userModel.findOne({ email });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    if (user.isVerified) {
      return { message: 'User is already verified.', statusCode: 400 };
    }

   // Генерируем новый код и сохраняем его в базу данных
    const newVerificationCode = generateVerificationCode();
    user.verificationCode = newVerificationCode;
    await user.save();

  // Отправляем новый код подтверждения
    await this.sendVerificationEmail(user.email, newVerificationCode);
  
    return { message: 'New verification code sent.', statusCode: 200 };
  }

  private async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
     // Создаем транспорт для отправки электронных писем (замените значения на свои)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: true, // true для порта 465, false для других портов
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    transporter.verify(function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });

 // Опции письма
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification',
      text: `Your verification code is: ${verificationCode}`,
    };
// Отправляем письмо
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error:', error);
        throw new Error('Failed to send verification email.');
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }
}

// Генерация случайного кода подтверждения
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
