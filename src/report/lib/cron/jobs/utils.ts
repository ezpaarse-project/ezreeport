/* eslint-disable import/prefer-default-export */
import { Recurrence } from '@prisma/client';
import { formatISO } from 'date-fns';
import { addReportToQueue } from '../../bull';

/**
 * Send generic error as a generation error
 *
 * @param error The error
 * @param origin origin of the error
 * @param recurrence Recurrence of CRON
 *
 * @returns When the error is put in queue
 */
export const sendError = (error: Error, origin: string, recurrence: Recurrence) => {
  const date = formatISO(new Date());
  const errStr = `[ErrorName] ${error.name}\n[ErrorMessage] ${error.message}\n[ErrorDate] ${date}\n\n${error.stack}`;

  return addReportToQueue({
    success: false,
    file: Buffer.from(errStr).toString('base64'),
    task: {
      recurrence,
      name: `[CRON] ${origin}`,
      targets: [], // unused because of success: false
      institution: process.env.NODE_ENV ?? 'dev',
    },
    date,
    url: `/ErrCron-${recurrence}-${origin}-${date}.txt`,
  });
};
