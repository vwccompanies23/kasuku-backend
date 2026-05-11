import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { Follow } from './follow.entity';
import { Music } from '../music/music.entity';
import { Release } from '../releases/release.entity';

import { AccountType } from './account-type.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { EmailService } from '../email/email.service';
import { DistributionService } from '../distributions/distribution.service';
import { CloudinaryService } from '../common/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,

    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,

    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,

    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly distributionService: DistributionService,
    private readonly cloudinary: CloudinaryService,
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
async setFreeAccess(
  userId: number,
  data: {
    plan: string;
    days?: number;
    months?: number;
    years?: number;
    revenuePercentage?: number;
    isManaged?: boolean;
  },
) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(
      'User not found ❌',
    );
  }

  // 🔥 PLAN
  user.plan = data.plan;

  // 🔥 FREE ACCESS
  user.isFreeOverride = true;

  // 🔥 REVENUE %
  user.revenuePercentage =
    data.revenuePercentage ?? 15;

  // 🔥 MANAGED
  user.isManaged =
    data.isManaged || false;

  // 🔥 EXPIRE DATE
  const expire = new Date();

if (data.days) {
  expire.setDate(
    expire.getDate() + data.days,
  );
}

if (data.months) {
  expire.setMonth(
    expire.getMonth() + data.months,
  );
}

if (data.years) {
  expire.setFullYear(
    expire.getFullYear() + data.years,
  );
}

if (
  data.days ||
  data.months ||
  data.years
) {
  user.freeAccessExpiresAt =
    expire;
}

  await this.usersRepo.save(user);


// 📧 EMAIL
  try {
    await this.emailService.send(
      user.email,
      '🎉 Kasuku Access Granted',
      `
      Your account has been upgraded to ${data.plan.toUpperCase()} access.

      ${
        data.months
          ? `Access expires in ${data.months} month(s).`
          : 'You have unlimited access.'
      }

      Revenue share: ${
        user.revenuePercentage
      }%
      `,
      {
        name: user.artistName,
        buttonText: 'Open Dashboard 🚀',
        buttonLink:
          'https://kasukuu.com/dashboard',
      },
    );
  } catch (err) {
    console.log(
      'Grant access email failed:',
      err.message,
    );
  }

  return {
    success: true,
    message:
      'Managed access granted successfully 🚀',
  };
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

  if (user.role === 'admin') {
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

  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  // ✅ ONLY SAFE FIELDS
  user.firstName = data.firstName || user.firstName;

  user.lastName = data.lastName || user.lastName;

  user.artistName =
    data.artistName || user.artistName;

  user.bio = data.bio || user.bio;

  user.avatar = data.avatar || user.avatar;

  user.website = data.website || user.website;

  user.instagram =
    data.instagram || user.instagram;

  user.twitter =
    data.twitter || user.twitter;

  user.youtube =
    data.youtube || user.youtube;

  await this.usersRepo.save(user);

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
      role: user.role,
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

  async makeAdmin(userId: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(
      'User not found ❌',
    );
  }

  user.role = UserRole.ADMIN;

  await this.usersRepo.save(user);

  return {
    success: true,
    message: 'User promoted to admin ✅',
  };
}

async removeAdmin(userId: number) {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(
      'User not found ❌',
    );
  }

  user.role = UserRole.USER;

  await this.usersRepo.save(user);

  return {
    success: true,
    message: 'Admin removed successfully ✅',
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
  const user = await this.usersRepo.findOne({
    where: { id: userId },
    relations: ['releases'],
  });

  if (!user) {
    throw new NotFoundException('User not found ❌');
  }

  if (user.role === 'admin') {
    throw new BadRequestException('Cannot delete admin 🚫');
  }

  console.log('🔥 STARTING FULL ACCOUNT DELETE');

  // =========================
  // 1. GET USER RELEASES
  // =========================
  const releases = await this.releaseRepo.find({
    where: { user: { id: userId } as any },
    relations: ['music'],
  });

  // =========================
  // 2. SEND TAKEDOWN REQUEST
  // =========================
  for (const release of releases) {
    console.log(`🚫 Takedown for release: ${release.title}`);

    // mark status
    release.status = 'takedown_requested';

    await this.releaseRepo.save(release);

    // send to distributor
    try {
      await this.distributionService.sendRelease({
        type: 'TAKEDOWN',
        releaseId: release.id,
        title: release.title,
      });
    } catch (err) {
      console.log('⚠️ Takedown failed:', err.message);
    }
  }

  // =========================
// ☁️ DELETE CLOUD FILES
// =========================
for (const release of releases) {
  for (const track of release.music || []) {
    if (track.fileUrl) {
      await this.cloudinary.deleteFile(track.fileUrl);
    }

    if (track.coverUrl) {
      await this.cloudinary.deleteFile(track.coverUrl);
    }
  }
}

console.log('☁️ All Cloudinary files deleted');

  // =========================
  // 3. DELETE MUSIC
  // =========================
  await this.musicRepo.delete({
    user: { id: userId } as any,
  });

  console.log('🗑️ All music deleted');

  // =========================
  // 4. DELETE RELEASES
  // =========================
  await this.releaseRepo.delete({
    user: { id: userId } as any,
  });

  console.log('🗑️ All releases deleted');

  // =========================
  // 5. DELETE USER
  // =========================
  await this.usersRepo.delete(userId);

  console.log('💀 USER FULLY DELETED');

  return {
    success: true,
    message: 'Account and all data deleted successfully 🚀',
  };
 }

 // =========================
// 📞 UPDATE CONTACT INFO
// =========================
async updateContactInfo(
  userId: number,
  data: any,
) {
  const user =
    await this.usersRepo.findOne({
      where: { id: userId },
    });

  if (!user) {
    throw new BadRequestException(
      'User not found ❌',
    );
  }

  user.firstName =
    data.firstName || user.firstName;

  user.lastName =
    data.lastName || user.lastName;

  user.phone =
    data.phone || user.phone;

  user.country =
    data.country || user.country;

  user.address =
    data.address || user.address;

  return this.usersRepo.save(user);
}
}