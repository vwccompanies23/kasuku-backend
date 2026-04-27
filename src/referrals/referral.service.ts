import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Referral } from './referral.entity';
import { Repository } from 'typeorm';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,

    private readonly settingsService: SettingsService,
  ) {}

  // =========================
  // 🎯 GENERATE REFERRAL CODE
  // =========================
  generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // =========================
  // 🔥 ASSIGN CODE
  // =========================
  async assignReferralCode(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('User not found');

    if (!user.referralCode) {
      user.referralCode = this.generateCode();
      await this.userRepo.save(user);
    }

    return user.referralCode;
  }

  // =========================
  // 🎯 APPLY REFERRAL (🔥 FIXED WITH GLOBAL CHECK)
  // =========================
  async applyReferral(userId: number, code: string) {
    // 🔥 GLOBAL ADMIN CHECK
    const settings = await this.settingsService.getSettings();

    if (!settings.referralsEnabled) {
      throw new BadRequestException('Referrals are disabled ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('User not found');

    // 🔥 USER-LEVEL CHECK
    if (!user.referralEnabled) {
      throw new BadRequestException('Referral not allowed for this user ❌');
    }

    const referrer = await this.userRepo.findOne({
      where: { referralCode: code },
    });

    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }

    // ❌ prevent self-referral
    if (referrer.id === user.id) {
      throw new BadRequestException('Cannot refer yourself ❌');
    }

    // already referred
    if (user.referredBy) {
      return { success: true };
    }

    // 🔥 SAVE LINK
    user.referredBy = code;
    await this.userRepo.save(user);

    // 🔥 TRACK REFERRAL
    const referral = this.referralRepo.create({
      referrerId: referrer.id,
      referredUserId: user.id,
      referralCode: code,
    });

    await this.referralRepo.save(referral);

    // 🔥 REWARD CHECK
    await this.checkAndReward(referrer.id);

    return { success: true };
  }

  // =========================
  // 📊 COUNT REFERRALS
  // =========================
  async countReferrals(userId: number) {
    return this.referralRepo.count({
      where: { referrerId: userId },
    });
  }

  // =========================
  // 🎁 REWARD LOGIC
  // =========================
  async checkAndReward(userId: number) {
    const count = await this.countReferrals(userId);

    if (count < 3) return;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) return;

    if (user.referralRewardGranted) return;

    user.subscriptionActive = true;
    user.plan = 'PRO';
    user.subscriptionStatus = 'active';
    user.referralRewardGranted = true;

    await this.userRepo.save(user);

    console.log(`🎉 User ${user.id} unlocked FREE 1 year`);
  }

  // =========================
  // 📊 STATS
  // =========================
  async getStats(userId: number) {
    const count = await this.countReferrals(userId);

    return {
      count,
      goal: 3,
      completed: count >= 3,
    };
  }

  // =========================
  // 🔧 ADMIN: TOGGLE USER REFERRALS (🔥 MISSING FIX)
  // =========================
  async toggleUserReferral(userId: number, enabled: boolean) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.referralEnabled = enabled;

    await this.userRepo.save(user);

    return {
      success: true,
      referralEnabled: user.referralEnabled,
    };
  }
}