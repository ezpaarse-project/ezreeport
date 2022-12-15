import Queue from 'bull';
import { join } from 'node:path';
import config from '../config';
import logger from '../logger';
import { type Recurrence } from '../recurrence';

const { concurrence, ...redis } = config.get('redis');

//! Should be synced with report
export type MailData = {
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
    institution: string,
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

const mailQueue = new Queue<MailData>('mail send', { redis });

mailQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull] ${err.message}`);
  }
});

mailQueue.process(concurrence, join(__dirname, 'jobs/sendReportMail.ts'));
