/* eslint-disable import/prefer-default-export */
import { addErrorToMailQueue } from '~/lib/bull';
import { formatISO } from '~/lib/date-fns';
import { appLogger as logger } from '~/lib/logger';
import config from '~/lib/config';

const { team } = config.report;

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

    await addErrorToMailQueue({
      file: Buffer.from(errStr).toString('base64'),
      filename: `ErrCron-${origin}-${date}.txt`,
      contact: team,
      date,
    });
    logger.info(`[cron] [${process.pid}] [${origin}] Sent error to dev team by mail`);
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`[cron] [${process.pid}] [${origin}] Cannot send error to dev team: {${e.message}}`);
    } else {
      logger.error(`[cron] [${process.pid}] [${origin}] Unexpected error when sending error to dev team: {${e}}`);
    }
  }
};
