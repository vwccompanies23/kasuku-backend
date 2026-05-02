import { Queue } from 'bullmq';

export const paymentsQueue = new Queue('payments', {
  connection: {
    url: process.env.REDIS_URL,
  },
});