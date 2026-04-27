import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentsService } from '../payments/payments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class PayoutsCron {
  constructor(
    private paymentsService: PaymentsService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // =========================
  // 💸 WEEKLY PAYOUT (MONDAY)
  // =========================
  @Cron('0 0 * * 1') // every Monday midnight
  async weeklyPayouts() {
    console.log('💸 Running WEEKLY payouts...');

    const users = await this.userRepo.find();

    for (const user of users) {
      await this.processUser(user);
    }
  }

  // =========================
  // 💸 MONTHLY BACKUP (1ST)
  // =========================
  @Cron('0 0 1 * *') // 1st of month
  async monthlyBackupPayouts() {
    console.log('💸 Running MONTHLY backup payouts...');

    const users = await this.userRepo.find();

    for (const user of users) {
      await this.processUser(user);
    }
  }

  // =========================
  // 🧠 CORE LOGIC
  // =========================
  private async processUser(user: User) {
    try {
      const MIN_PAYOUT = 50;

      // ❌ skip if low balance
      if (!user.balance || user.balance < MIN_PAYOUT) return;

      // ❌ skip if no Stripe
      if (!user.stripeAccountId) return;

      // 🔐 check Stripe status
      const status =
        await this.paymentsService.getStripeStatus(user.id);

      if (!status.connected || !status.payouts_enabled) {
        console.log(`⚠️ ${user.email} not ready for payouts`);
        return;
      }

      // 💸 PAYOUT
      const result = await this.paymentsService.withdraw(
        user.id,
        user.balance,
      );

      console.log(`✅ Paid ${user.email}`, result);

    } catch (err) {
      console.log(`❌ Failed payout for ${user.email}`);
    }
  }
}