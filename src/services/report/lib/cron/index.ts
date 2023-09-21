import { join } from 'node:path';

import { Queue, Worker, type WorkerOptions } from 'bullmq';

import config from '~/lib/config';
import { appLogger as logger } from '~/lib/logger';
import { formatInterval } from '~/lib/utils';

import { NotFoundError } from '~/types/errors';

const {
  redis,
  crons: { options: cronOptions, timers: cronTimers },
  workers: { maxExecTime },
} = config;

type Crons = keyof typeof cronTimers;

type JobInformation = Awaited<ReturnType<Queue['getRepeatableJobs']>>[number];

export type CronData = {
  timer: string,
};

const pausedJobs: Partial<Record<Crons, JobInformation>> = {};
const workers: Worker[] = [];

const limiter: WorkerOptions['limiter'] = {
  max: Object.keys(cronTimers).length,
  duration: maxExecTime,
};

let cronQueue: Queue<CronData> | undefined;

const getQueue = () => {
  if (!cronQueue) {
    throw new Error('crons are not initialized');
  }
  return cronQueue;
};

/**
 * Init crons
 */
export const initCrons = async () => {
  try {
    const start = new Date();
    logger.verbose('[cron] Init started');

    cronQueue = new Queue<CronData>('ezReeport.daily-cron', { prefix: 'cron', connection: redis });
    cronQueue.on('error', (err) => {
      logger.error(`[cron-queue] Failed with error: {${err.message}}`);
    });
    logger.verbose(`[cron] Created queue [${cronQueue.name}]`);

    const q = getQueue();
    // Cleaning next jobs before adding cron to avoid issues
    const jobs = await cronQueue.getRepeatableJobs();
    await Promise.all(
      jobs.map(async (j) => {
        await q.removeRepeatable(j.name, j);
        logger.verbose(`[cron] Deleted old cron: [${j.name}] [${j.pattern}]`);
      }),
    );

    // Adding all jobs
    await Promise.all(
      Object.entries(cronTimers).map(
        async ([key, timer]) => {
          // Using `.add` instead of `.addBulk` because the later doesn't support repeat option
          const job = await q.add(
            key,
            { timer },
            {
              repeat: {
                pattern: timer,
                tz: cronOptions.tz || undefined,
              },
            },
          );
          logger.verbose(`[cron] Creating cron: [${job.name}] [${timer}] [${cronOptions.tz || 'default'}]`);

          try {
            const worker = new Worker(
              `${q.name}.${key}`,
              join(__dirname, `jobs/${key}.ts`),
              { limiter, connection: redis },
            );
            worker.on('completed', (j) => {
              logger.verbose(`[cron-job] [${job.name}] job [${j?.id}] completed`);
            });
            worker.on('failed', (j, err) => {
              logger.error(`[cron-job] [${job.name}] job [${j?.id}] failed with error: {${err.message}}`);
            });
            worker.on('error', (err) => {
              logger.error(`[cron-job] [${job.name}] worker failed with error: {${err.message}}`);
            });
            workers.push(worker);
            logger.verbose(`[cron] Creating worker [${worker.name}] with [${limiter.max}] process and with [${maxExecTime}]ms before hanging`);
          } catch (error) {
            if (error instanceof Error) {
              logger.error(`[cron] Failed to add process for [${key}] [${timer}] [${cronOptions.tz || 'default'}] with error: {${error.message}}`);
            } else {
              logger.error(`[cron] An unexpected error occurred when adding process for  [${key}] [${timer}] [${cronOptions.tz || 'default'}]: {${error}}`);
            }

            if (job.opts.repeat && 'key' in job.opts.repeat) {
              await q.removeRepeatableByKey(`${job.opts.repeat?.key}`);
            }
          }
        },
      ),
    );

    const dur = formatInterval({ start, end: new Date() });
    logger.info(`[cron] Init completed in [${dur}]s`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`[cron] Init failed with error: {${error.message}}`);
    } else {
      logger.error(`[cron] An unexpected error occurred at init: {${error}}`);
    }
  }
};

/**
 * Check if given name is a valid cron name
 *
 * @param name Given name
 *
 * @returns Given name is a valid cron name
 */
const isCron = (name: string): name is Crons => Object.keys(cronTimers).includes(name);

/**
 * Get specific cron **without** format
 *
 * @param name The name of the cron
 *
 * @returns The cron info
 */
const getRawCron = async (name: string): Promise<JobInformation> => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron [${name}] not found`);
  }
  let job = (await getQueue().getRepeatableJobs()).find((j) => (name === j.name));
  if (!job) {
    job = pausedJobs[name];
  }
  if (!job) {
    throw new NotFoundError(`Cron [${name}] not found`);
  }
  return job;
};

const getLastRun = async (name: Crons) => {
  const lastJob = (await getQueue().getJobs(['completed'])).filter((j) => j.name === name).at(0);
  return lastJob?.processedOn ? new Date(lastJob.processedOn) : null;
};

// TODO[feat]: Paginate
// TODO[feat]: Filter
/**
 * Get all crons with format
 *
 * @returns The crons info
 */
export const getAllCrons = async () => {
  const jobs = await getQueue().getRepeatableJobs();
  const running = !(await getQueue().isPaused());

  return Promise.all(
    [...jobs, ...Object.values(pausedJobs)].map(async (j) => {
      const name = j.name as Crons;
      return {
        name: j.name,
        running: running && !pausedJobs[name],
        lastRun: await getLastRun(name),
        nextRun: !pausedJobs[name] ? new Date(j.next) : null,
      };
    }),
  );
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

  const running = !(await getQueue().isPaused()) && !pausedJobs[name as Crons];
  return {
    name: job.name,
    running,
    lastRun: await getLastRun(name as Crons),
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
    throw new NotFoundError(`Cron [${name}] not found`);
  }

  const job = pausedJobs[name];
  if (job) {
    await getQueue().add(
      name,
      { timer: job.pattern },
      { repeat: { pattern: job.pattern } },
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
    throw new NotFoundError(`Cron [${name}] not found`);
  }

  const job = (await getQueue().getRepeatableJobs()).find((j) => j.name === name);
  if (job) {
    await getQueue().removeRepeatable(job.name, job);
    pausedJobs[name] = job;
  }

  return getCron(name);
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
    throw new NotFoundError(`Cron [${name}] not found`);
  }

  await getQueue().add(name, { timer: cronTimers[name] });

  return { ...await getCron(name), lastRun: new Date() };
};
