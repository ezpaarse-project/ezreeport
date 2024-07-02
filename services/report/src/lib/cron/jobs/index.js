// @ts-check

const { initQueues } = require('../../bull');
const { appLogger: logger } = require('../../logger');

/**
 * @typedef {import('bullmq').Job<import('../../cron').CronData>} Job
*/

/**
 * @param {Job} job
 */
module.exports = async (job) => {
  try {
    initQueues(true, true);

    const { default: executor } = await import(`./${job.data.key.toString()}.js`);
    return executor(job);
  } catch (error) {
    logger.warn(`[cron] [${process.pid}] [${job.name}] Unexpected error occurred when dispatching executor: {${error}}`);
    return { error };
  }
};
