import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentsWorker implements OnModuleInit {
  constructor(private paymentsService: PaymentsService) {}

  onModuleInit() {
    new Worker(
      'payments',
      async (job) => {
        const { userId, amount, eventId } = job.data;

        await this.paymentsService.addEarnings(
          userId,
          amount,
        );
      },
      {
        connection: {
          url: process.env.REDIS_URL,
        },
      },
    );

    console.log('🚀 Payments Worker started');
  }
}