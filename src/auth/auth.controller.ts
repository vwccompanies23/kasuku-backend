import {
  Controller,
  Post,
  Body,
  Query,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // =========================
  // 📝 SIGNUP
  // =========================
  @Post('signup')
  signup(
    @Body() body: any,
    @Query('ref') ref?: string,
  ) {
    return this.authService.signup(this.userRepo, {
      ...body,
      referralCode:
        ref || body.referralCode,
    });
  }

  // =========================
  // 🔐 LOGIN (SEND OTP)
  // =========================
  @Post('login')
  async login(@Body() body: any) {
    return this.authService.loginAndSendOtp(
      this.userRepo,
      body.email,
      body.password,
    );
  }

  // =========================
  // 🔢 SEND OTP
  // =========================
  @Post('send-otp')
  sendOtp(@Body() body: any) {
    return this.authService.sendOtp(
      body.email,
    );
  }

  // =========================
  // ✅ VERIFY OTP + RETURN JWT
  // =========================
  @Post('verify-otp')
  async verifyOtp(
    @Body()
    body: {
      email: string;
      code: string;
    },
  ) {
    return await this.authService.verifyOtp(
      body.email,
      body.code,
    );
  }

  // =========================
  // 🔐 RESET PASSWORD
  // =========================
  @Post('reset-password')
  resetPassword(@Body() body: any) {
    return this.authService.resetPassword(
      this.userRepo,
      body.email,
      body.code,
      body.password,
    );
  }
}