import Queue from 'bull';
import { join } from 'node:path';
import config from '~/lib/config';
import logger from '~/lib/logger';
import { type Recurrence } from '~/models/recurrence';

const { ...redis } = config.get('redis');
const { concurrence, maxExecTime } = config.get('workers');

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

const baseQueueOptions: Queue.QueueOptions = {
  redis,
  limiter: {
    max: concurrence,
    duration: maxExecTime,
  },
};

const mailQueue = new Queue<MailData>('ezReeport.mail-send', baseQueueOptions);

mailQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull] ${err.message}`);
  }
});

mailQueue.process(join(__dirname, 'jobs/sendReportMail.ts'));
