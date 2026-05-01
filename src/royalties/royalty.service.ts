import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Royalty } from './royalty.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RoyaltyService {
  constructor(
    @InjectRepository(Royalty)
    private readonly royaltyRepo: Repository<Royalty>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // =========================
  // 💰 CREDIT ROYALTY + BALANCE
  // =========================
  async credit(
    userId: number,
    amount: number,
    source: string,
    musicId?: number, // 🔥 NEW
  ) {
    if (!userId || amount == null) {
      throw new Error('Invalid royalty data ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found ❌');
    }

    // 💰 UPDATE USER BALANCE
    let finalAmount = Number(amount);

// 🔥 APPLY COMMISSION FOR FREE USERS
if (!user.subscriptionActive && !user.isFreeOverride) {
  finalAmount = finalAmount * 0.6; // user gets 60%
}

// 💰 UPDATE USER BALANCE
user.balance = (user.balance || 0) + finalAmount;
    await this.userRepo.save(user);

    // 🧾 CREATE ROYALTY RECORD
    const royalty = this.royaltyRepo.create({
      amount: amount,
      netAmount: finalAmount,
      source,
      user,

      // 🔥 NEW (LINK TO MUSIC)
      music: musicId ? ({ id: musicId } as any) : null,
    });

    return this.royaltyRepo.save(royalty);
  }

  // =========================
  // 📜 USER ROYALTIES
  // =========================
  async getUserRoyalties(userId: number) {
    return this.royaltyRepo.find({
      where: { user: { id: userId } as any },
      order: { createdAt: 'DESC' },
      relations: ['music'], // 🔥 OPTIONAL (SAFE ADD)
    });
  }

  // =========================
  // 💰 TOTAL EARNINGS
  // =========================
  async getTotalEarnings(userId: number) {
    const result = await this.royaltyRepo
      .createQueryBuilder('r')
      .select('SUM(r.amount)', 'total')
      .where('r.userId = :userId', { userId })
      .getRawOne();

    return Number(result?.total || 0);
  }

  // =========================
  // 📊 MONTHLY EARNINGS
  // =========================
  async getMonthlyEarnings(userId: number) {
    return this.royaltyRepo
      .createQueryBuilder('r')
      .select("DATE_TRUNC('month', r.createdAt)", 'month')
      .addSelect('SUM(r.amount)', 'total')
      .where('r.userId = :userId', { userId })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  // =========================
  // 🎵 EARNINGS BY SOURCE
  // =========================
  async getEarningsBySource(userId: number) {
    return this.royaltyRepo
      .createQueryBuilder('r')
      .select('r.source', 'source')
      .addSelect('SUM(r.amount)', 'total')
      .where('r.userId = :userId', { userId })
      .groupBy('r.source')
      .getRawMany();
  }

  // =========================
  // 📜 RECENT TRANSACTIONS
  // =========================
  async getRecent(userId: number) {
    return this.royaltyRepo.find({
      where: { user: { id: userId } as any },
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['music'], // 🔥 OPTIONAL (SAFE ADD)
    });
  }
}