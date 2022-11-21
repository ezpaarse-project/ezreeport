import Queue from 'bull';
import { join } from 'node:path';
import { NotFoundError } from '../../types/errors';
import config from '../config';
import logger from '../logger';
import { formatInterval } from '../utils';

const { concurrence, ...redis } = config.get('redis');
const cronsTimers = config.get('crons');

type Crons = keyof typeof cronsTimers;

export type CronData = {
  timer: string,
};

const cronQueue = new Queue<CronData>('daily cron', { prefix: 'cron', redis });
cronQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[cron] Failed with error: ${err.message}`);
  }
});

/**
 * Init crons
 */
(async () => {
  try {
    const start = new Date();
    logger.debug('[cron] Init started');
    // Cleaning next jobs before adding cron to avoid issues
    const jobs = await cronQueue.getRepeatableJobs();
    await Promise.all(
      jobs.map(async (j) => {
        await cronQueue.removeRepeatable(j.name, j);
        logger.debug(`[cron] ${j.name} (${j.cron}) deleted`);
      }),
    );

    // Adding all jobs
    await Promise.all(
      Object.entries(cronsTimers).map(
        async ([key, timer]) => {
          // Using `.add` instead of `.addBulk` because the later doesn't support repeat option
          const job = await cronQueue.add(
            key,
            { timer },
            { repeat: { cron: timer } },
          );
          //! DO NOT AWAIT IN ANY CASE
          cronQueue.process(key, concurrence, join(__dirname, `jobs/${key}.ts`));
          logger.debug(`[cron] ${job.name} registered for ${timer}`);
        },
      ),
    );

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] Init completed in ${dur}s`);
  } catch (error) {
    logger.error(`[cron] Init failed with error: ${(error as Error).message}`);
  }
})();

/**
 * Check if given name is a valid cron name
 *
 * @param name Given name
 *
 * @returns Given name is a valid cron name
 */
const isCron = (name: string): name is Crons => Object.keys(cronsTimers).includes(name);

// TODO[feat]: Paginate
// TODO[feat]: Filter
/**
 * Get all crons
 *
 * @returns The crons info
 */
export const getAllCrons = async () => {
  const jobs = await cronQueue.getRepeatableJobs();
  const running = !(await cronQueue.isPaused());

  return jobs.map((j) => ({
    name: j.name,
    running,
    // lastRun,
    nextRun: new Date(j.next),
  }));
};

/**
 * Get specific cron
 *
 * @param name The name of the cron
 *
 * @returns The cron info
 */
export const getCron = async (name: string) => {
  const job = (await cronQueue.getRepeatableJobs()).find((j) => (name === j.name));
  if (!job) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  return {
    name: job.name,
    running: !(await cronQueue.isPaused()),
    // lastRun,
    nextRun: new Date(job.next),
  };
};

/**
 * Start specific cron
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const startCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  // TODO[feat]: resume only one job ?
  await cronQueue.resume();

  return getCron(name);
};

/**
 * Stop specific cron
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const stopCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  // TODO[feat]: pause only one job ?
  await cronQueue.pause();

  return getCron(name);
};
