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

const pausedJobs: Partial<Record<Crons, Queue.JobInformation>> = {};

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

/**
 * Get specific cron **without** format
 *
 * @param name The name of the cron
 *
 * @returns The cron info
 */
const getRawCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }
  let job = (await cronQueue.getRepeatableJobs()).find((j) => (name === j.name));
  if (!job) {
    job = pausedJobs[name];
  }
  if (!job) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }
  return job;
};

// TODO[feat]: Paginate
// TODO[feat]: Filter
/**
 * Get all crons with format
 *
 * @returns The crons info
 */
export const getAllCrons = async () => {
  const jobs = await cronQueue.getRepeatableJobs();
  const running = !(await cronQueue.isPaused());

  return [...jobs, ...Object.values(pausedJobs)].map((j) => ({
    name: j.name,
    running: running && !pausedJobs[j.name as Crons],
    // lastRun,
    nextRun: !pausedJobs[j.name as Crons] ? new Date(j.next) : null,
  }));
};

/**
 * Get specific cron with format
 *
 * @param name The name of the cron
 *
 * @returns The cron info
 */
export const getCron = async (name: string) => {
  const job = await getRawCron(name);

  const running = !(await cronQueue.isPaused()) && !pausedJobs[name as Crons];
  return {
    name: job.name,
    running,
    // lastRun,
    nextRun: running ? new Date(job.next) : null,
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

  const job = pausedJobs[name];
  if (job) {
    await cronQueue.add(
      name,
      { timer: job.cron },
      { repeat: { cron: job.cron } },
    );
    delete pausedJobs[name];
  }

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

  const job = (await cronQueue.getRepeatableJobs()).find((j) => j.name === name);
  if (job) {
    await cronQueue.removeRepeatable(job.name, job);
    pausedJobs[name] = job;
  }

  return {
    name: pausedJobs[name]?.name,
    running: !(await cronQueue.isPaused()) && !pausedJobs[name],
    // lastRun,
  };
};

/**
 * Force specific cron to run
 *
 * @param name The cron name
 *
 * @returns The cron info
 */
export const forceCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  await cronQueue.add(name, { timer: cronsTimers[name] });

  return getCron(name);
};
