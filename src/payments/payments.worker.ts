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
          host: '127.0.0.1',
          port: 6379,
        },
      },
    );

    console.log('🚀 Payments Worker started');
  }
}