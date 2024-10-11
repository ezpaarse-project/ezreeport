// @ts-check

const { initQueues } = require('../../bull');
const { appLogger } = require('../../logger');

/**
 * @typedef {import('bullmq').Job<import('../../cron').CronData>} Job
*/

/**
 * @param {Job} job
 */
module.exports = async (job) => {
  const logger = appLogger.child({
    scope: 'cron',
    job: job.id,
    cron: {
      name: job.name,
    },
  });

  try {
    initQueues(true, true);

    const { default: executor } = await import(`./${job.data.key.toString()}.js`);
    return executor(job, logger);
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Unexpected error occurred when dispatching executor',
    });
    return { error };
  }
};
