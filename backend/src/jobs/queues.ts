import { Queue } from 'bullmq';
import { redis } from '../config';

// PDF generation queue
export const pdfQueue = new Queue('pdf-generation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Email notification queue
export const emailQueue = new Queue('email-notifications', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

// Report generation queue
export const reportQueue = new Queue('report-generation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

export const queues = { pdfQueue, emailQueue, reportQueue };
