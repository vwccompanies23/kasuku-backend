import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { Follow } from './follow.entity';

import { AccountType } from './account-type.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,

    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // =====================
// 💳 STRIPE STATUS
// =====================
async getStripeStatus(userId: number) {
  if (!userId || isNaN(userId)) {
    throw new BadRequestException('Invalid user ID ❌');
  }

  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  return {
    connected: !!user.stripeAccountId,
    accountId: user.stripeAccountId || null,
  };
}

  // =====================
  // 🔥 FIND ONE
  // =====================
  async findOne(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found ❌');
    }

    return user;
  }

// =====================
// 📧 SEND TO ONE USER (FIXED)
// =====================
async sendEmailToUser(
  identifier: number | string,
  subject: string,
  message: string,
) {
  let user;

  if (typeof identifier === 'number') {
    user = await this.usersRepo.findOne({ where: { id: identifier } });

    if (!user) throw new NotFoundException('User not found ❌');
  } else {
    user = { email: identifier, name: 'User' };
  }

  await this.emailService.send(user.email, subject, message, {
    name: (user as any).name || user.email,
    buttonText: 'Open Kasuku 🚀',
    buttonLink: 'https://kasuku.com/dashboard',
  });

  return { success: true };
}

// =====================
// 🆓 FREE ACCESS
// =====================
async setFreeAccess(userId: number, value: boolean) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  user.isFreeOverride = value;
  await this.usersRepo.save(user);

  return { success: true };
}

// =====================
// 📧 SEND TO ALL USERS (FIX)
// =====================
async sendEmailToAll(subject: string, message: string) {
  const users = await this.usersRepo.find();

  for (const user of users) {
    await this.emailService.send(user.email, subject, message, {
      name: user.email,
      buttonText: 'Open Kasuku 🚀',
      buttonLink: 'https://kasuku.com/dashboard',
    });
  }

  return { success: true };
}

// =====================
// 💰 CUSTOM PRICE
// =====================
async setCustomPrice(userId: number, price: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  (user as any).customSubscriptionPrice = price;

  await this.usersRepo.save(user);

  return { success: true };
}

  // =====================
  // 💳 UPDATE SUBSCRIPTION
  // =====================
  async updateSubscription(
    userId: number,
    plan: 'solo' | 'artists' | 'pro',
    billingCycle: 'monthly' | 'yearly',
  ) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');

    user.plan = plan;
    user.billingCycle = billingCycle;
    user.subscriptionStatus = 'active';

    return this.usersRepo.save(user);
  }

  // =====================
// 👤 FIND BY ID (FIX)
// =====================
async findById(id: number) {
  if (!id || isNaN(id)) {
    throw new BadRequestException('Invalid user ID');
  }

  const user = await this.usersRepo.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

// =====================
// 🌍 PUBLIC PROFILE (FIX)
// =====================
async getPublicProfile(userId: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
    relations: ['releases', 'followers'],
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  const { password, ...safeUser } = user;

  return {
    ...safeUser,
    followersCount: user.followers?.length || 0,
  };
}

  // =====================
  // ✅ CREATE USER
  // =====================
  async createUser(
    email: string,
    password: string,
    accountType: AccountType,
  ) {
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await this.usersRepo.findOne({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const user = this.usersRepo.create({
      email: cleanEmail,
      password: hashedPassword,
      accountType,
    });

    const savedUser = await this.usersRepo.save(user);

    const { password: _, ...safeUser } = savedUser;
    return safeUser;
  }

  // =====================
// 🔄 GENERIC UPDATE (FIX)
// =====================
async update(userId: number, data: any) {
  if (!userId || isNaN(userId)) {
    throw new BadRequestException('Invalid user ID');
  }

  await this.usersRepo.update(userId, data);
  return this.findById(userId);
}

// =====================
// 🔓 UNBAN USER (FIX)
// =====================
async unbanUser(userId: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  user.isActive = true;
  await this.usersRepo.save(user);

  return {
    success: true,
    message: 'User unbanned ✅',
  };
}

// =====================
// 🚫 BAN USER (FIX)
// =====================
async banUser(userId: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  if (user.isAdmin) {
    throw new BadRequestException('Cannot ban admin 🚫');
  }

  user.isActive = false;
  await this.usersRepo.save(user);

  return {
    success: true,
    message: 'User banned 🚫',
  };
}

  // =====================
// 👤 UPDATE PROFILE
// =====================
async updateProfile(userId: number, data: any) {
  if (!userId || isNaN(userId)) {
    throw new BadRequestException('Invalid user ID');
  }

  await this.usersRepo.update(userId, data);
  return this.findById(userId);
}

  // =====================
  // 🔐 LOGIN
  // =====================
  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await this.usersRepo.findOne({
      where: { email: cleanEmail },
    });

    if (!user) throw new Error('Invalid email or password');
    if (!user.isActive) throw new Error('Account is banned');

    const isMatch = await bcrypt.compare(password.trim(), user.password as string);

    if (!isMatch) throw new Error('Invalid email or password');

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const { password: _, ...safeUser } = user;

    return {
      access_token: token,
      user: safeUser,
    };
  }

  // =====================
  // 👥 GET ALL USERS
  // =====================
  async findAll() {
    const users = await this.usersRepo.find();
    return users.map(({ password, ...user }) => user);
  }

  // =====================
  // 🆕 UNPAID USERS
  // =====================
  async getUnpaidUsers() {
    const users = await this.usersRepo.find({
      where: { subscriptionStatus: 'inactive' },
    });

    return users.map(({ password, ...u }) => u);
  }

  // =====================
  // 📊 ADMIN STATS
  // =====================
  async getAdminStats() {
    const users = await this.usersRepo.find();

    return {
      totalUsers: users.length,
      active: users.filter(u => u.subscriptionStatus === 'active').length,
      unpaid: users.filter(u => u.subscriptionStatus !== 'active').length,
    };
  }

  // =====================
// ➕ FOLLOW (QUICK FIX)
// =====================
async followUser(userId: number, targetId: number) {
  console.log('Follow:', userId, targetId);

  return { success: true };
}

// =====================
// ❌ UNFOLLOW (QUICK FIX)
// =====================
async unfollowUser(userId: number, targetId: number) {
  console.log('Unfollow:', userId, targetId);

  return { success: true };
}

  // =====================
  // 🗑 DELETE USER
  // =====================
  async delete(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found ❌');
    if (user.isAdmin) throw new BadRequestException('Cannot delete admin 🚫');

    await this.usersRepo.delete(userId);

    return { success: true };
  }
}