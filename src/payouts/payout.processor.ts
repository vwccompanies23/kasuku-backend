import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payout } from './payout.entity';
import { PayoutsService } from './payouts.service';

@Processor('payouts')
@Injectable()
export class PayoutProcessor {
  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,

    private readonly payoutsService: PayoutsService,
  ) {}

  @Process('process-payout')
  async handle(job: Job<{ payoutId: number }>) {
    const { payoutId } = job.data;

    const payout = await this.payoutRepo.findOne({
      where: { id: payoutId },
    });

    if (!payout) throw new Error('Payout not found');

    await this.payoutsService.processPayout(payout);
  }
}