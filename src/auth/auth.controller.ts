import { Body, Controller, Get, Post, Redirect, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<{ message: string; statusCode: number }> {
    return this.authService.signUp(signUpDto);
  }

  @Post('/verify')
  async verify(@Body() body: any): Promise<void> {
    const { email, verificationCode } = body;
    await this.authService.verifyAccount(email, verificationCode);
  }

  @Post('/resend-verification-code')
  async resendVerificationCode(
    @Body() body: any,
  ): Promise<{ message: string; statusCode: number }> {
    const { email } = body;
    return this.authService.resendVerificationCode(email);
  }

  @Post('/login')
  login(@Body() loginDto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(loginDto);
  }
}
