import type { Job } from 'bullmq';

import { appLogger } from '~/lib/logger';
import { formatISO } from '~/lib/date-fns';
import config from '~/lib/config';

import { initQueues, queueError } from '~/models/queues';

const { team } = config.report;

/**
 * Send generic error as a generation error
 *
 * @param error The error
 * @param origin origin of the error
 * @param logger
 *
 * @returns When the error is put in queue
 */
async function sendError(error: Error, origin: string, logger: import('pino').Logger): Promise<void> {
  try {
    const now = new Date();
    const date = formatISO(now);
    const errStr = `[ErrorName] ${error.name}\n[ErrorMessage] ${error.message}\n[ErrorDate] ${date}\n\n${error.stack}`;

    await queueError({
      file: Buffer.from(errStr).toString('base64'),
      filename: `ErrCron-${origin}-${date}.txt`,
      contact: team,
      date: now,
    });
    logger.info({
      origin,
      team,
      msg: 'Sent error to dev team by mail',
    });
  } catch (err) {
    logger.error({
      origin,
      err,
      msg: 'Cannot send error to dev team',
    });
  }
}

export default async function executeCron(job: Job) {
  const logger = appLogger.child({
    scope: 'cron',
    job: job.id,
    cron: {
      name: job.name,
    },
  });

  try {
    initQueues(true, true);

    const { default: executor } = await import(`./${job.data.key.toString()}.ts`);
    return executor(job, logger);
  } catch (error) {
    await sendError(error as Error, job.name, logger);
    return { error };
  }
}
