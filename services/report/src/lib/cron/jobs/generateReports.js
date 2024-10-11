// @ts-check

const { addTaskToGenQueue } = require('../../bull');
const { endOfDay } = require('../../date-fns');

const { getAllTasksToGenerate } = require('../../../models/tasks');

const { sendError } = require('./utils');

/**
 * @typedef {import('bullmq').Job<import('..').CronData>} Job
 */

/**
 * @param {Job} job
 * @param {import('pino').Logger} logger
 */
module.exports = async (job, logger) => {
  const start = Date.now();
  logger.debug('Started');

  try {
    // Getting end of today, to ignore hour of task's nextRun
    const today = endOfDay(start);
    const tasks = await getAllTasksToGenerate(today);

    const { length } = await Promise.all(
      tasks.map(
        async (task, i, arr) => {
          await addTaskToGenQueue({ task, namespace: task.namespace, origin: 'daily-cron-job' });
          await job.updateProgress(i / arr.length);
        },
      ),
    );

    const end = Date.now();
    logger.info({
      reportCounts: length,
      cronDuration: end - start,
      cronDurationUnit: 'ms',
      msg: 'Generated report(s)',
    });
  } catch (err) {
    const end = Date.now();
    logger.error({
      cronDuration: end - start,
      cronDurationUnit: 'ms',
      err,
      msg: 'Failed to generate report(s)',
    });
    await sendError(err, job.name, logger);
  }
};
