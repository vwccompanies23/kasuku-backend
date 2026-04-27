import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';

import { EarningsService } from './earnings.service';

@Processor('earnings') // 🔥 MUST MATCH QUEUE NAME
export class EarningsProcessor {
  constructor(
    private earningsService: EarningsService,
  ) {}

  // =========================
  // ⚡ PROCESS EARNING JOB
  // =========================
  @Process('process-earning')
  async handleEarning(job: Job) {
    const { userId, amount, platform, musicId } = job.data;

    console.log('⚡ Processing earning job:', job.data);

    // 1️⃣ SAVE EARNING
    await this.earningsService.saveEarning({
      userId,
      amount,
      platform,
      musicId,
    });

    // 2️⃣ GET CURRENT MONTH
    const month = new Date().toISOString().slice(0, 7);

    // 3️⃣ GENERATE + SEND REPORT
    await this.earningsService.sendMonthlyReport(
      userId,
      month,
    );

    console.log(`✅ Done processing earning for user ${userId}`);
  }
}