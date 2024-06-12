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

      // User exists but is not verified
      const verificationCode = generateVerificationCode();
      const hashedPassword = await bcrypt.hash(password, 10);

      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.verificationCode = verificationCode;
      existingUser.isVerified = false;
      
      await existingUser.save();

      await this.sendVerificationEmail(existingUser.email, verificationCode);

      return { message: 'Email already registered. New verification code sent.', statusCode: 201 };
    }

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
      throw new UnauthorizedException('Invalid email');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account not verified');
    }
    
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.jwtService.sign({ id: user._id });

    return { token, statusCode: 201 };
  }

  async verifyAccount(email: string, verificationCode: string): Promise<{ message: string, statusCode: number }> {
    const user = await this.userModel.findOne({ email, verificationCode }).exec();

    if (!user) {
      throw new NotFoundException('Invalid verification code');
    }

    user.isVerified = true;
    await user.save();
    
    return { message: 'Email verified successful', statusCode: 201 }; 
  }catch (error) {
      console.error('Error during sign-up:', error);
      return { message: 'Error: Email not validated', statusCode: 500 };
  }

  async resendVerificationCode(email: string): Promise<{ message: string, statusCode: number }> {
    const user = await this.userModel.findOne({ email });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    if (user.isVerified) {
      return { message: 'User is already verified.', statusCode: 400 };
    }

    const newVerificationCode = generateVerificationCode();
    user.verificationCode = newVerificationCode;
    await user.save();

    await this.sendVerificationEmail(user.email, newVerificationCode);
  
    return { message: 'New verification code sent.', statusCode: 200 };
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean, isVerified: boolean }> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return { exists: false, isVerified: false };
    }

    return { exists: true, isVerified: user.isVerified };
  }

  private async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
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

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification',
      text: `Your verification code is: ${verificationCode}`,
    };

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

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
