import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { randomUUID } from 'crypto';

import { PaymentsService } from '../payments/payments.service';
import { Payout } from './payout.entity';
import { User } from '../users/user.entity';

import { StripeService } from '../payments/stripe.service';
import { EarningsService } from '../earnings/earnings.service';
import { PaypalService } from '../paypal/paypal.service';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly paymentsService: PaymentsService,
    private readonly stripe: StripeService,
    private readonly earningsService: EarningsService,
    private readonly paypalService: PaypalService,
  ) {}

  // =========================
  // 🔥 AUTO PAYOUT LISTENER
  // =========================
  @OnEvent('payout.trigger')
  async handleAutoPayout(payload: { userId: number }) {
    await this.processAutoPayout(payload.userId);
  }

  // =========================
  // 💰 ADD TO BALANCE
  // =========================
  async addToBalance(userId: number, amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    user.balance = Number(user.balance || 0) + amount;
    await this.userRepo.save(user);

    return { success: true, balance: user.balance };
  }

  // =========================
  // 💸 REQUEST WITHDRAW (FIXED)
  // =========================
  async requestWithdraw(
    userId: number,
    amount: number,
    method: 'stripe' | 'paypal',
    email?: string,
  ): Promise<Payout> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');
    if (user.balance < amount)
      throw new BadRequestException('Insufficient balance');

    // 🔒 lock balance
    user.balance -= amount;
    await this.userRepo.save(user);

    const payout: Payout = this.payoutRepo.create({
      userId,
      amount,
      method,
      email,
      status: 'pending',
      idempotencyKey: randomUUID(),
    });

    const saved: Payout = await this.payoutRepo.save(payout);

    // ✅ DIRECT PROCESS (NO QUEUE)
    await this.processPayout(saved);

    return saved;
  }

  async forceUnlock(id: number) {
  const payout = await this.payoutRepo.findOne({
    where: { id },
  });

  if (!payout) throw new NotFoundException('Payout not found');

  payout.locked = false;
  payout.status = 'pending';

  await this.payoutRepo.save(payout);

  return { message: 'Payout unlocked' };
}

  // =========================
  // 🚀 PROCESS PAYOUT
  // =========================
  async processPayout(input: Payout) {
    const payout = await this.payoutRepo.findOne({
      where: { id: input.id },
    });

    if (!payout) throw new Error('Payout not found');

    if (payout.locked || payout.status === 'completed') return;

    payout.locked = true;
    payout.status = 'processing';
    await this.payoutRepo.save(payout);

    try {
      let result: any;

      switch (payout.method) {
        case 'paypal':
          if (!payout.email)
            throw new Error('PayPal email required');

          result = await this.paypalService.sendPayout(
            payout.email,
            payout.amount,
          );

          payout.externalId =
            result?.batch_header?.payout_batch_id || null;
          break;

        case 'stripe':
          if (!payout.stripeAccountId)
            throw new Error('Stripe account required');

          result = await this.stripe.stripe.transfers.create({
            amount: Math.floor(payout.amount * 100),
            currency: 'usd',
            destination: payout.stripeAccountId,
          });

          payout.externalId = result.id;
          break;

        default:
          throw new Error('Unsupported payout method');
      }

      payout.status = 'completed';
      payout.locked = false;

      await this.payoutRepo.save(payout);
    } catch (err: any) {
      payout.status = 'failed';
      payout.locked = false;
      payout.retryCount += 1;

      await this.payoutRepo.save(payout);

      if (payout.retryCount >= 5) {
        const user = await this.userRepo.findOne({
          where: { id: payout.userId },
        });

        if (user) {
          user.balance += payout.amount;
          await this.userRepo.save(user);
        }
      }

      throw err;
    }
  }

  // =========================
  // 💸 AUTO PAYOUT
  // =========================
  async processAutoPayout(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.stripeAccountId) return;

    const account = await this.stripe.stripe.accounts.retrieve(
      user.stripeAccountId,
    );

    if (!account.payouts_enabled) return;

    const summary = await this.earningsService.getUserSummary(userId);
    if (summary.total < 50) return;

    await this.stripe.stripe.transfers.create({
      amount: Math.floor(summary.total * 100),
      currency: 'usd',
      destination: user.stripeAccountId,
    });

    await this.earningsService.deleteAllUserEarnings(userId);
  }

  // =========================
  // 📜 HISTORY
  // =========================
  async getHistory(userId: number) {
    return this.payoutRepo.find({
      where: { user: { id: userId } as any },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getWallet(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return { balance: user?.balance || 0 };
  }

  async approvePayout(id: number) {
    const payout = await this.payoutRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!payout)
      throw new NotFoundException('Payout not found');

    payout.status = 'approved';
    return this.payoutRepo.save(payout);
  }

  async retryPayout(id: number) {
    const payout = await this.payoutRepo.findOne({
      where: { id },
    });

    if (!payout) throw new NotFoundException('Payout not found');

    if (payout.status !== 'failed') {
      throw new BadRequestException('Only failed payouts can be retried');
    }

    payout.status = 'pending';
    payout.locked = false;

    await this.payoutRepo.save(payout);

    // ✅ DIRECT PROCESS
    await this.processPayout(payout);

    return { message: 'Payout retried' };
  }

  async forceProcess(id: number) {
    const payout = await this.payoutRepo.findOne({
      where: { id },
    });

    if (!payout) throw new NotFoundException('Payout not found');

    await this.processPayout(payout);

    return { message: 'Payout forced' };
  }

  async getAllPayouts() {
    return this.payoutRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFailedPayouts() {
    return this.payoutRepo.find({
      where: { status: 'failed' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async rejectPayout(id: number) {
    const payout = await this.payoutRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!payout)
      throw new NotFoundException('Payout not found');

    if (!payout.user)
      throw new BadRequestException('User not found');

    payout.user.balance += payout.amount;
    payout.status = 'rejected';

    await this.userRepo.save(payout.user);
    return this.payoutRepo.save(payout);
  }
}