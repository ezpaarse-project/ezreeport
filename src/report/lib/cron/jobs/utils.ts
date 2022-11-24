/* eslint-disable import/prefer-default-export */
import { Recurrence } from '@prisma/client';
import { formatISO } from 'date-fns';
import { addReportToQueue } from '../../bull';
import logger from '../../logger';

/**
 * Send generic error as a generation error
 *
 * @param error The error
 * @param origin origin of the error
 * @param timer Timer of CRON
 *
 * @returns When the error is put in queue
 */
export const sendError = async (error: Error, origin: string, _timer: string) => {
  try {
    const date = formatISO(new Date());
    const errStr = `[ErrorName] ${error.name}\n[ErrorMessage] ${error.message}\n[ErrorDate] ${date}\n\n${error.stack}`;

    await addReportToQueue({
      success: false,
      file: Buffer.from(errStr).toString('base64'),
      task: {
        id: '',
        recurrence: Recurrence.DAILY, // TODO[feat]: based on cron
        name: `[CRON] ${origin}`,
        targets: [], // unused because of success: false
        institution: process.env.NODE_ENV ?? 'dev',
      },
      date,
      url: `/ErrCron-${origin}-${date}.txt`,
    });
    logger.info('[cron] ');
  } catch (e) {
    logger.error('[cron] ');
  }
};
