// @ts-check

const { addErrorToMailQueue } = require('../../bull');
const { formatISO } = require('../../date-fns');
const { appLogger: logger } = require('../../logger');
const config = require('../../config').default;

const { team } = config.report;

/**
 * Send generic error as a generation error
 *
 * @param {Error} error The error
 * @param {string} origin origin of the error
 * @param {string} _timer Timer of CRON
 *
 * @returns {Promise<void>} When the error is put in queue
 */
exports.sendError = async (error, origin, _timer) => {
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
