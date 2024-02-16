// @ts-check

const { addTaskToGenQueue } = require('../../bull');
const { endOfDay } = require('../../date-fns');
const { appLogger: logger } = require('../../logger');
const { formatInterval } = require('../../utils');

const { getAllTasksToGenerate } = require('../../../models/tasks');

const { sendError } = require('./utils');

/**
 * @typedef {import('bullmq').Job<import('..').CronData>} Job
 */

/**
 * @param {Job} job
 */
module.exports = async (job) => {
  const start = new Date();
  logger.verbose(`[cron] [${process.pid}] [${job.name}] Started`);

  try {
    // Getting end of today, to ignore hour of task's nextRun
    const today = endOfDay(start);
    const tasks = await getAllTasksToGenerate(today);

    const { length } = await Promise.all(
      tasks.map(
        async (task, i, arr) => {
          await addTaskToGenQueue({ task, origin: 'daily-cron-job' });
          await job.updateProgress(i / arr.length);
        },
      ),
    );

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] [${process.pid}] [${job.name}] Generated [${length}] report(s) in [${dur}]s`);
  } catch (error) {
    const dur = formatInterval({ start, end: new Date() });
    if (error instanceof Error) {
      logger.error(`[cron] [${process.pid}] [${job.name}] Job failed in [${dur}]s with error: {${error.message}}`);
      await sendError(error, job.name, job.data.timer);
    } else {
      logger.error(`[cron] [${process.pid}] [${job.name}] Unexpected error occurred after [${dur}]s: {${error}}`);
    }
  }
};
