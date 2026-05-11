import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ReferralService } from '../referrals/referral.service';
import { EmailService } from 'src/email/email.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity'; // adjust path if needed
import { UserRole } from '../users/user-role.enum';

type OtpRecord = {
  code: string;
  expires: number;
  created: number;
};

@Injectable()
export class AuthService {
  constructor(
  private jwtService: JwtService,
  private referralService: ReferralService,
  private emailService: EmailService,

  @InjectRepository(User)
  private userRepo: Repository<User>,
) {}

  // =========================
  // 🧠 OTP STORE
  // =========================
 private otpStore = new Map<string, OtpRecord>();

  // =========================
  // 🆕 SIGNUP
  // =========================
  async signup(userRepo: any, data: any) {
    const exists = await userRepo.findOne({
      where: { email: data.email },
    });

    if (exists) {
  throw new BadRequestException(
    'Email already exists ❌',
  );
}

  

    const hashed = await bcrypt.hash(data.password.trim(), 10);

    const user = await userRepo.save({
      email: data.email.trim().toLowerCase(),
      password: hashed,
      artistName: data.artist || 'New Artist 👽',
    });

    if (data.referralCode) {
      try {
        await this.referralService.applyReferral(
          user.id,
          data.referralCode,
        );
      } catch (err) {
        console.log('Referral failed:', err.message);
      }
    }

    await this.referralService.assignReferralCode(user.id);

    return this.generateToken(user);
  }

  // =========================
  // 🔐 LOGIN → SEND OTP ONLY
  // =========================
  async loginAndSendOtp(userRepo: any, email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await userRepo.findOne({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Account has no password ❌',
      );
    }

    const valid = await bcrypt.compare(
      password.trim(),
      user.password,
    );

    if (!valid) {
      throw new BadRequestException('Wrong password ❌');
    }

    // ✅ SEND OTP AFTER PASSWORD SUCCESS
    await this.sendOtp(cleanEmail);

    return {
      success: true,
      message: 'OTP sent to your email 📩',
    };
  }

  // =========================
  // 🔢 SEND OTP
  // =========================
 async sendOtp(email: string) {
  const cleanEmail = email.trim().toLowerCase();

  // 🔑 get existing OTP (if any)
  const existing = this.otpStore.get(cleanEmail);

  // 🚫 PREVENT SPAM (ADD THIS HERE)
  if (existing && Date.now() - existing.created < 30000) {
    throw new BadRequestException('Wait before requesting another OTP');
  }

  // 🔢 generate new code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('📩 Sending OTP to:', cleanEmail);
  console.log('🧠 GENERATED OTP:', code);

  // 💾 store OTP
  this.otpStore.set(cleanEmail, {
    code,
    created: Date.now(), // ⬅️ IMPORTANT (needed for cooldown)
    expires: Date.now() + 5 * 60 * 1000, // 5 min
  });

  // 📧 send email
  await this.emailService.sendOtpEmail(cleanEmail, code);

  return { success: true };
}

  // =========================
  // ✅ VERIFY OTP → RETURN TOKEN
  // =========================
 async verifyOtp(email: string, code: string) {
  const cleanEmail = email.trim().toLowerCase();

  const record = this.otpStore.get(cleanEmail);

  if (!record) {
    throw new BadRequestException('No OTP found');
  }

  // ⏰ expired check
  if (Date.now() > record.expires) {
    this.otpStore.delete(cleanEmail);
    throw new BadRequestException('Code expired');
  }

  // ❌ wrong code (FIXED)
  if (record.code !== code.trim()) {
    throw new BadRequestException('Invalid code');
  }

  // ✅ SUCCESS → delete OTP
  this.otpStore.delete(cleanEmail);

  console.log('✅ OTP VERIFIED:', cleanEmail);

  // 🔥 GET USER
  const user = await this.userRepo.findOne({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  // 🔑 RETURN TOKEN (THIS WAS MISSING)
  console.log('🔥 USER ROLE:', user.role);

  return this.generateToken(user);
}

  // =========================
  // 🔐 RESET PASSWORD
  // =========================
  async resetPassword(
    userRepo: any,
    email: string,
    code: string,
    newPassword: string,
  ) {
    const cleanEmail = email.trim().toLowerCase();

    const record = this.otpStore.get(cleanEmail);

    if (!record) {
      throw new BadRequestException('OTP not found ❌');
    }

    if (Date.now() > record.expires) {
      this.otpStore.delete(cleanEmail);
      throw new BadRequestException('OTP expired ⏳');
    }

    if (record.code !== code) {
      throw new BadRequestException('Invalid OTP ❌');
    }

    const user = await userRepo.findOne({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

    const hashed = await bcrypt.hash(newPassword.trim(), 10);

    user.password = hashed;

    await userRepo.save(user);

    this.otpStore.delete(cleanEmail);

    return {
      success: true,
      message: 'Password reset successful ✅',
    };
  }

// =========================
// 🔑 GENERATE JWT
// =========================
generateToken(user: User) {
  const token = this.jwtService.sign({
    userId: user.id,
    email: user.email,
    role: user.role,

    // ✅ PLAN
    plan: user.plan || 1,

    // ✅ SUBSCRIPTION
    subscriptionActive:
      user.subscriptionActive || false,

    // ✅ ARTIST
    artistName: user.artistName,
  });

  return {
    success: true,

    token,

    user: {
      id: user.id,
      email: user.email,
      artistName: user.artistName,
      role: user.role,

      // ✅ SEND TO FRONTEND
      plan: user.plan || 1,
      subscriptionActive:
        user.subscriptionActive || false,
    },
  };
 }
}