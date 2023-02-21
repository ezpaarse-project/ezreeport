import Queue from 'bull';
import { join } from 'node:path';
import config from '~/lib/config';
import logger from '~/lib/logger';
import { formatInterval } from '~/lib/utils';
import { NotFoundError } from '~/types/errors';
import { baseQueueOptions } from '../bull';

const { options: cronOptions, timers: cronTimers } = config.get('crons');
const { maxExecTime } = config.get('workers');

type Crons = keyof typeof cronTimers;

export type CronData = {
  timer: string,
};

const pausedJobs: Partial<Record<Crons, Queue.JobInformation>> = {};

const queueOptions: Queue.QueueOptions = {
  ...baseQueueOptions,
  limiter: {
    max: Object.keys(cronTimers).length,
    duration: maxExecTime,
  },
};

const cronQueue = new Queue<CronData>('ezReeport.daily-cron', { prefix: 'cron', ...queueOptions });
cronQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[cron-job] Failed with error: ${err.message}`);
  }
});
cronQueue.on('error', (err) => {
  logger.error(`[cron-queue] Failed with error: ${err.message}`);
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
      Object.entries(cronTimers).map(
        async ([key, timer]) => {
          // Using `.add` instead of `.addBulk` because the later doesn't support repeat option
          const job = await cronQueue.add(
            key,
            { timer },
            {
              repeat: {
                cron: timer,
                tz: cronOptions.tz || undefined,
              },
            },
          );
          try {
            //! TS type is kinda wrong here, it's not a promise
            cronQueue.process(key, join(__dirname, `jobs/${key}.ts`));
            logger.debug(`[cron] ${job.name} registered with "${timer}" for "${cronOptions.tz || 'default'}"`);
          } catch (error) {
            logger.error(`[cron] Failed to add process for ${key} ("${timer}" for "${cronOptions.tz || 'default'}") with error: ${(error as Error).message}`);
            if (job.opts.repeat && 'key' in job.opts.repeat) {
              // @ts-expect-error
              await cronQueue.removeRepeatableByKey(job.opts.repeat?.key);
            }
          }
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
const isCron = (name: string): name is Crons => Object.keys(cronTimers).includes(name);

/**
 * Get specific cron **without** format
 *
 * @param name The name of the cron
 *
 * @returns The cron info
 */
const getRawCron = async (name: string): Promise<Queue.JobInformation> => {
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

const getLastRun = async (name: Crons) => {
  const lastJob = (await cronQueue.getJobs(['completed'])).filter((j) => j.name === name).at(0);
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
  const jobs = await cronQueue.getRepeatableJobs();
  const running = !(await cronQueue.isPaused());

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

  const running = !(await cronQueue.isPaused()) && !pausedJobs[name as Crons];
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
    throw new NotFoundError(`Cron "${name}" not found`);
  }

  await cronQueue.add(name, { timer: cronTimers[name] });

  return { ...await getCron(name), lastRun: new Date() };
};
