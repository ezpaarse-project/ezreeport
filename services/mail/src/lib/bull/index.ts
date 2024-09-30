import { join } from 'node:path';

import { Queue, Worker } from 'bullmq';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type { Recurrence } from '~/models/recurrence';

const logger = appLogger.child({ scope: 'bull' });

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
  },
  namespace: string,
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

logger.debug('Init started');
const start = Date.now();
const mailQueue = new Queue<MailResult>('ezReeport.mail-send', { connection: redis });
logger.debug({
  queue: mailQueue.name,
  msg: 'Created queue',
});

const worker = new Worker(
  mailQueue.name,
  join(__dirname, 'jobs/sendReportMail.js'),
  {
    connection: redis,
    limiter: {
      max: concurrence,
      duration: maxExecTime,
    },
  },
);
worker.on('completed', (job) => {
  logger.debug({
    queue: mailQueue.name,
    job: job?.id,
    msg: 'Job completed',
  });
});
worker.on('failed', (job, err) => {
  logger.debug({
    queue: mailQueue.name,
    job: job?.id,
    err,
    msg: 'Job failed',
  });
});
worker.on('error', (err) => {
  logger.debug({
    queue: mailQueue.name,
    err,
    msg: 'WOrker failed',
  });
});

workers.push(worker);
logger.debug({
  queue: mailQueue.name,
  worker: {
    name: worker.name,
    concurrency: concurrence,
    maxExecTime,
  },
  msg: 'Created worker',
});

logger.info({
  initDuration: Date.now() - start,
  initDurationUnit: 'ms',
  msg: 'Init completed',
});

export const redisPing = async () => {
  const res = await (await mailQueue.client).ping();
  return res === 'PONG';
};
