import Queue from 'bull';
import { join } from 'node:path';
import config from '../config';
import logger from '../logger';
import { type Recurrence } from '../recurrence';

const { concurrence, ...redis } = config.get('redis');

//! Should be synced with report
export type MailData = {
  file: any,
  reccurence: Recurrence,
  date: Date,
  url: string
};

const mailQueue = new Queue<MailData>('mail send', { redis });

mailQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull] ${err.message}`);
  }
});

mailQueue.process(concurrence, join(__dirname, 'jobs/sendReportMail.ts'));
