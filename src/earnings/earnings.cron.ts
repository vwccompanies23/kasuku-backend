import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EarningsService } from './earnings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class EarningsCron {
  constructor(
    private earningsService: EarningsService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // =========================
  // 🔁 RUN EVERY MONTH (1st day)
  // =========================
  @Cron('0 0 1 * *') // midnight, 1st of month
  async handleMonthlyReports() {
    console.log('📊 Generating monthly reports...');

    const users = await this.userRepo.find();

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const month = lastMonth.toISOString().slice(0, 7);

    for (const user of users) {
      try {
        await this.earningsService.sendMonthlyReport(
          user.id,
          month,
        );

        console.log(`✅ Report sent to ${user.email}`);
      } catch (err) {
        console.log(`❌ Failed for ${user.email}`);
      }
    }
  }
}