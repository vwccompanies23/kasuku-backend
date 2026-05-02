import { Queue } from 'bullmq';

export const payoutQueue = new Queue('payouts', {
  connection: {
    url: process.env.REDIS_URL,
  },
});