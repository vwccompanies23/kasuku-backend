import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ReferralService } from '../referrals/referral.service'; // 🔥 ADD

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private referralService: ReferralService, // 🔥 ADD
  ) {}

  // =========================
  // 🧠 OTP STORE
  // =========================
  private otpStore = new Map<
    string,
    { code: string; expires: number }
  >();

  // =========================
  // 🆕 SIGNUP (🔥 CONNECTED TO REFERRALS)
  // =========================
  async signup(userRepo: any, data: any) {
    const exists = await userRepo.findOne({
      where: { email: data.email },
    });

    if (exists) {
      throw new BadRequestException('Email already exists ❌');
    }

    const hashed = await bcrypt.hash(data.password.trim(), 10);

    const user = await userRepo.save({
      email: data.email.trim().toLowerCase(),
      password: hashed,
      artistName: data.artist || 'New Artist 👽',
    });

    // =========================
    // 🔥 APPLY REFERRAL (IF EXISTS)
    // =========================
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

    // =========================
    // 🔥 ALWAYS GENERATE USER REF CODE
    // =========================
    await this.referralService.assignReferralCode(user.id);

    return this.generateToken(user);
  }

  // =========================
  // 🔐 LOGIN
  // =========================
 async login(userRepo: any, data: any) {
  console.log('📥 LOGIN DATA:', data);

  const email = data.email.trim().toLowerCase();
  const password = data.password.trim();

  const user = await userRepo.findOne({
    where: { email },
  });

  console.log('👤 USER FOUND:', user);

  if (!user) {
    throw new BadRequestException('User not found ❌');
  }

  if (!user.password) {
    throw new BadRequestException(
      'This account has no password. Please sign up again ❌',
    );
  }

  const valid = await bcrypt.compare(password, user.password);

  console.log('🔐 PASSWORD VALID:', valid);

  if (!valid) {
    throw new BadRequestException('Wrong password ❌');
  }

  console.log('🔑 JWT SECRET:', process.env.JWT_SECRET);

  return this.generateToken(user);
}

  // =========================
  // 🔢 SEND OTP
  // =========================
  async sendOtp(email: string) {
    if (!email) {
      throw new BadRequestException('Email required ❌');
    }

    const cleanEmail = email.trim().toLowerCase();

    const code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const expires = Date.now() + 5 * 60 * 1000;

    this.otpStore.set(cleanEmail, { code, expires });

    console.log('🔐 OTP for', cleanEmail, ':', code);

    return {
      success: true,
      message: 'OTP sent successfully 📩',
    };
  }

  // =========================
  // ✅ VERIFY OTP
  // =========================
  async verifyOtp(userRepo: any, email: string, code: string) {
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

    this.otpStore.delete(cleanEmail);

    let user = await userRepo.findOne({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await userRepo.save({
        email: cleanEmail,
        password: null,
        artistName: 'New Artist 👽',
      });

      // 🔥 GENERATE REF CODE FOR OTP USERS TOO
      await this.referralService.assignReferralCode(user.id);
    }

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
  generateToken(user: any) {
    return {
      access_token: this.jwtService.sign({
        userId: user.id,
        email: user.email,
        artistName: user.artistName,
        stripeAccountId: user.stripeAccountId || null,

        isAdmin: user.isAdmin || false,

        role: user.role || (user.isAdmin ? 'admin' : 'user'),
      }),
    };
  }
}