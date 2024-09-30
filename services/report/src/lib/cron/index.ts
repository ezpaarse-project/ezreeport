import { join } from 'node:path';

import { Queue, Worker, type WorkerOptions } from 'bullmq';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { formatInterval } from '~/lib/utils';

import { NotFoundError } from '~/types/errors';

const {
  redis,
  crons: { options: cronOptions, timers: cronTimers },
  workers: { maxExecTime },
} = config;

const logger = appLogger.child({ scope: 'cron' });

type Crons = keyof typeof cronTimers;

type JobInformation = Awaited<ReturnType<Queue['getRepeatableJobs']>>[number];

export type CronData = {
  timer: string,
  key: Crons
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
    logger.debug('Init started');

    cronQueue = new Queue<CronData>('ezReeport.daily-cron', { connection: redis });
    cronQueue.on('error', (err) => {
      logger.error({
        err,
        queue: cronQueue?.name,
        msg: 'Failed with an unexpected error',
      });
    });

    logger.debug({
      queue: cronQueue.name,
      msg: 'Created queue',
    });

    const q = getQueue();
    // Cleaning next jobs before adding cron to avoid issues
    const jobs = await cronQueue.getRepeatableJobs();
    await Promise.all(
      jobs.map(async (j) => {
        await getQueue().removeRepeatableByKey(j.key);
        logger.debug({
          queue: cronQueue?.name,
          cron: {
            name: j.name,
            pattern: j.pattern,
          },
          msg: 'Deleted old cron',
        });
      }),
    );

    // Adding all jobs
    await Promise.all(
      Object.entries(cronTimers).map(
        async ([key, timer]) => {
          // Using `.add` instead of `.addBulk` because the later doesn't support repeat option
          const job = await q.add(
            key,
            { timer, key: key as Crons },
            {
              repeat: {
                pattern: timer,
                tz: cronOptions.tz || undefined,
              },
            },
          );
          logger.debug({
            queue: cronQueue?.name,
            cron: {
              name: key,
              pattern: timer,
              tz: cronOptions.tz || 'default',
            },
            msg: 'Created cron',
          });

          try {
            const worker = new Worker(
              q.name,
              join(__dirname, 'jobs/index.js'),
              { limiter, connection: redis },
            );
            worker.on('completed', (j) => {
              logger.debug({
                queue: cronQueue?.name,
                cron: {
                  name: j.data.key,
                  pattern: j.data.timer,
                  tz: cronOptions.tz || 'default',
                },
                job: j?.id,
                msg: 'Cron completed',
              });
            });
            worker.on('failed', (j, err) => {
              logger.debug({
                queue: cronQueue?.name,
                cron: {
                  name: j?.data.key,
                  pattern: j?.data.timer,
                  tz: cronOptions.tz || 'default',
                },
                job: j?.id,
                err,
                msg: 'Cron failed',
              });
            });
            worker.on('error', (err) => {
              logger.debug({
                queue: cronQueue?.name,
                cron: {
                  name: key,
                  pattern: timer,
                  tz: cronOptions.tz || 'default',
                },
                err,
                msg: 'Cron\'s worker failed',
              });
            });

            workers.push(worker);
            logger.debug({
              queue: cronQueue?.name,
              cron: {
                name: key,
                pattern: timer,
                tz: cronOptions.tz || 'default',
              },
              worker: {
                name: worker.name,
                max: limiter.max,
                maxExecTime,
              },
              msg: 'Cron\'s worker created',
            });
          } catch (err) {
            logger.error({
              queue: cronQueue?.name,
              cron: {
                name: key,
                pattern: timer,
                tz: cronOptions.tz || 'default',
              },
              err,
              msg: 'Failed to add process',
            });

            if (job.opts.repeat && 'key' in job.opts.repeat) {
              await q.removeRepeatableByKey(`${job.opts.repeat?.key}`);
            }
          }
        },
      ),
    );

    logger.info({
      initDuration: formatInterval({ start, end: new Date() }),
      initDurationUnit: 's',
      msg: 'Init completed',
    });
  } catch (error) {
    logger.error(error, 'Init failed');
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
 */
export const startCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron [${name}] not found`);
  }

  const job = pausedJobs[name];
  if (job) {
    await getQueue().add(
      name,
      { timer: job.pattern, key: name },
      { repeat: { pattern: job.pattern } },
    );
    delete pausedJobs[name];
  }
};

/**
 * Stop specific cron
 *
 * @param name The cron name
 */
export const stopCron = async (name: string) => {
  if (!isCron(name)) {
    throw new NotFoundError(`Cron [${name}] not found`);
  }

  const job = (await getQueue().getRepeatableJobs()).find((j) => j.name === name);
  if (!job) {
    return;
  }

  await getQueue().removeRepeatableByKey(job.key);
  pausedJobs[name] = job;
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

  await getQueue().add(name, { timer: cronTimers[name], key: name });

  return { ...await getCron(name), lastRun: new Date() };
};
