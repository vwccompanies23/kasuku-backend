import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Withdrawal } from './withdrawal.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawRepo: Repository<Withdrawal>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // =========================
  // 💸 USER REQUEST
  // =========================
  async requestWithdraw(userId: number, amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found ❌');
    }

    if ((user.balance || 0) < amount) {
      throw new BadRequestException('Insufficient balance ❌');
    }

    let netAmount = amount;

    // 💡 FREE USER → 40% cut
    if (!user.subscriptionActive && user.isFreeOverride) {
      netAmount = amount * 0.6;
    }

    // 🚫 unpaid premium user → blocked
    if (!user.subscriptionActive && !user.isFreeOverride) {
      throw new BadRequestException('🔒 Subscription required to withdraw');
    }

    // 💰 deduct balance
    user.balance -= amount;
    await this.userRepo.save(user);

    const withdrawal = this.withdrawRepo.create({
      amount,
      netAmount,
      status: 'pending',
      user,
    });

    return this.withdrawRepo.save(withdrawal);
  }

  // =========================
  // 📜 GET ALL (ADMIN)
  // =========================
  async getAll() {
    return this.withdrawRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // =========================
  // ✅ APPROVE
  // =========================
  async approve(id: number) {
    const withdrawal = await this.withdrawRepo.findOne({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found ❌');
    }

    withdrawal.status = 'approved';
    return this.withdrawRepo.save(withdrawal);
  }

  // =========================
  // ❌ REJECT
  // =========================
  async reject(id: number) {
    const withdrawal = await this.withdrawRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found ❌');
    }

    // 💰 refund user
    withdrawal.user.balance += withdrawal.amount;
    await this.userRepo.save(withdrawal.user);

    withdrawal.status = 'rejected';
    return this.withdrawRepo.save(withdrawal);
  }

  // =========================
  // 💸 MARK AS PAID
  // =========================
  async markPaid(id: number) {
    const withdrawal = await this.withdrawRepo.findOne({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found ❌');
    }

    withdrawal.status = 'paid';
    return this.withdrawRepo.save(withdrawal);
  }
}