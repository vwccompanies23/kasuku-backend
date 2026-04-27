import { Queue } from 'bullmq';

export const payoutQueue = new Queue('payouts', {
  connection: {
    host: '127.0.0.1',
    port: 6379,
  },
});