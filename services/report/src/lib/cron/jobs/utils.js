// @ts-check

const { addErrorToMailQueue } = require('../../bull');
const { formatISO } = require('../../date-fns');
const config = require('../../config').default;

const { team } = config.report;

/**
 * Send generic error as a generation error
 *
 * @param {Error} error The error
 * @param {string} origin origin of the error
 * @param {import('pino').Logger} logger
 *
 * @returns {Promise<void>} When the error is put in queue
 */
exports.sendError = async (error, origin, logger) => {
  try {
    const date = formatISO(new Date());
    const errStr = `[ErrorName] ${error.name}\n[ErrorMessage] ${error.message}\n[ErrorDate] ${date}\n\n${error.stack}`;

    await addErrorToMailQueue({
      file: Buffer.from(errStr).toString('base64'),
      filename: `ErrCron-${origin}-${date}.txt`,
      contact: team,
      date,
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
};
