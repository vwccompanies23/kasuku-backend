import { Queue } from 'bullmq';

export const paymentsQueue = new Queue('payments', {
  connection: {
    host: '127.0.0.1',
    port: 6379,
  },
});