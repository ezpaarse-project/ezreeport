import { join } from 'node:path';

import type { Queue, Worker } from 'bullmq';

import config from '~/lib/config';
import { formatInterval } from '~/lib/utils';
import { appLogger } from '~/lib/logger';

import { createQueue, pingQueue } from '~/lib/bull';
import { addRepeatableJob, clearRepeatableJobs, formatCron } from '~/lib/cron';

import type { CronDataType, CronNameType, CronDescriptionType } from './types';

const {
  crons: { timers: cronTimers },
  workers: { maxExecTime },
} = config;

type JobInformation = Awaited<ReturnType<Queue['getRepeatableJobs']>>[number];

/**
 * Crons that are paused, allow keeping track of them
 */
const pausedCrons = new Map<CronNameType, JobInformation>();
/**
 * Workers initialized
 */
const workers: Worker[] = [];
/**
 * Queue initialized
 */
let queue: Queue<CronDataType> | undefined;

const logger = appLogger.child({ scope: 'models', model: 'crons' });

/**
 * Initialize crons
 *
 * @param skipLogs Skip logs
 * @param skipWorkers Skip workers
 */
export async function initCrons(skipLogs = false, skipWorkers = false) {
  if (!skipLogs) { logger.debug('Init started'); }
  const start = new Date();

  try {
    queue = createQueue('cron', 'ezReeport.daily-cron', !skipLogs ? logger : undefined);

    if (!skipWorkers) {
      await clearRepeatableJobs(queue, !skipLogs ? logger : undefined);
      workers.splice(0, workers.length);

      const q = queue; // Static reference of queue
      const createdWorkers = await Promise.all(
        Object.entries(cronTimers).map(
          async ([key, timer]) => addRepeatableJob(
            q,
            key,
            timer,
            join(__dirname, 'jobs/index.ts'),
            { max: 1, duration: maxExecTime },
            !skipLogs ? logger : undefined,
          ),
        ),
      );
      workers.push(...createdWorkers.filter((w) => !!w));
    }

    if (!skipLogs) {
      logger.info({
        initDuration: formatInterval({ start, end: new Date() }),
        initDurationUnit: 's',
        msg: 'Init completed',
      });
    }
  } catch (err) {
    if (!skipLogs) { logger.error(err, 'Init failed'); }
  }
}

/**
 * List all crons
 *
 * @returns All cron
 */
export async function getAllCrons(): Promise<CronDescriptionType[]> {
  if (!queue) {
    throw new Error('crons are not initialized');
  }

  const q = queue; // Static reference
  const isQueuePaused = await queue.isPaused();
  const jobs = [...pausedCrons.values(), ...await queue.getRepeatableJobs()];

  return Promise.all(
    jobs.map(async (job) => {
      const formattedCron = await formatCron(q, job);

      const isCronPaused = pausedCrons.has(job.name as CronNameType);
      const running = !isQueuePaused && !isCronPaused;

      return {
        ...formattedCron,
        running,
        nextRun: running ? formattedCron.nextRun : null,
      };
    }),
  );
}
/**
 * Toggle state of cron
 *
 * @param name Name of cron
 *
 * @returns The updated cron
 */
export async function toggleCron(name: CronNameType) {
  if (!queue) {
    throw new Error('crons are not initialized');
  }

  const pausedJob = pausedCrons.get(name);
  if (pausedJob) {
    // Resume cron by adding it back to the queue
    await queue.add(
      name,
      { timer: pausedJob.pattern, key: name },
      { repeat: { pattern: pausedJob.pattern } },
    );
    pausedCrons.delete(name);

    logger.debug({
      name,
      action: 'Paused',
      msg: 'Paused',
    });
  } else {
    // Pause cron by removing it from the queue
    const jobs = await queue.getRepeatableJobs();
    const job = jobs.find((j) => j.name === name);
    if (!job) {
      throw new Error(`Cron ${name} not found`);
    }

    await queue.removeRepeatableByKey(job.key);
    pausedCrons.set(name, job);

    logger.debug({
      name,
      action: 'Resumed',
      msg: 'Resumed',
    });
  }

  const cron = (await getAllCrons()).find((c) => c.name === name);
  // As we just added it, the presence of the cron is guaranteed
  return cron!;
}

/**
 * Force restart of cron
 *
 * @param name The cron name
 *
 * @returns The updated cron
 */
export async function restartCron(name: CronNameType) {
  if (!queue) {
    throw new Error('crons are not initialized');
  }

  const now = new Date();
  await queue.add(name, { timer: cronTimers[name], key: name });

  logger.debug({
    name,
    action: 'Restarted',
    msg: 'Restarted',
  });

  const cron = (await getAllCrons()).find((c) => c.name === name);
  return {
    // As we just added it, the presence of the cron is guaranteed
    ...cron!,
    lastRun: now,
  };
}

/**
 * Ping redis host to check if it's alive
 *
 * @returns 200 if ping is successful, false otherwise
 */
export function pingRedisThroughCron() {
  if (!queue) {
    throw new Error('cron are not initialized');
  }
  return pingQueue(queue);
}
