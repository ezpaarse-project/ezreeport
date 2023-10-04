import { join } from 'node:path';

import { Queue, Worker } from 'bullmq';

import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';

import type { Recurrence } from '~/models/recurrence';

const {
  redis,
  workers: { concurrence, maxExecTime },
} = config;

//! Should be synced with report
export type MailResult = {
  /**
   * If task succeed or failed
   */
  success: boolean,
  /**
   * The file data (in base64)
   */
  file: string,
  /**
   * The task's data
   */
  task: {
    id: string,
    recurrence: Recurrence,
    name: string,
    targets: string[],
    namespace: string,
  },
  /**
   * The email of the user that was used for generation
   */
  contact?: string,
  /**
   * The generation date
   */
  date: string,
  /**
   * The http url to get the file
   */
  url: string,
};

const workers: Worker[] = [];

logger.verbose('[bull] Init started');
const start = new Date();
const mailQueue = new Queue<MailResult>('ezReeport.mail-send', { connection: redis });

const worker = new Worker(
  mailQueue.name,
  join(__dirname, 'jobs/sendReportMail.ts'),
  {
    connection: redis,
    limiter: {
      max: concurrence,
      duration: maxExecTime,
    },
  },
);
worker.on('completed', (job) => {
  logger.verbose(`[bull] [mail] job [${job?.id}] completed`);
});
worker.on('failed', (job, err) => {
  logger.error(`[bull] [mail] job [${job?.id}] failed with error: {${err.message}}`);
});
worker.on('error', (err) => {
  logger.error(`[bull] [mail] worker failed with error: {${err.message}}`);
});

workers.push(worker);
logger.info(`[bull] Init completed in [${new Date().getTime() - start.getTime()}]ms`);
