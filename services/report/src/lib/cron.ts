import type { Queue, RepeatableJob, WorkerOptions } from 'bullmq';
import type { Logger } from 'pino';

import config from '~/lib/config';
import { createWorker } from '~/lib/bull';

import type { CronNameType, CronDescriptionType } from '~/models/crons/types';

const {
  crons: { options: cronOptions },
} = config;

export async function clearRepeatableJobs(queue: Queue, logger?: Logger) {
  const jobs = await queue.getRepeatableJobs();

  await Promise.all(
    jobs.map(async (j) => {
      queue.removeRepeatableByKey(j.key);

      if (logger) {
        logger.debug({
          queue: queue.name,
          cron: {
            name: j.name,
            pattern: j.pattern,
          },
          msg: 'Deleted old cron',
        });
      }
    }),
  );
}

export async function addRepeatableJob(
  queue: Queue,
  key: string,
  timer: string,
  file: string,
  limiter?: WorkerOptions['limiter'],
  logger?: Logger,
) {
  const job = await queue.add(
    key,
    { timer, key },
    {
      repeat: {
        pattern: timer,
        tz: cronOptions.tz || undefined,
      },
    },
  );

  if (logger) {
    const cron = { name: key, pattern: timer, tz: cronOptions.tz || 'default' };
    logger.debug({ queue: queue.name, cron, msg: 'Added cron' });
  }

  let worker;
  try {
    worker = createWorker(queue, file, limiter, logger);
  } catch (err) {
    if (logger) {
      const cron = { name: key, pattern: timer, tz: cronOptions.tz || 'default' };
      logger.error({
        queue: queue.name,
        cron,
        err,
        msg: 'Failed to add process',
      });
    }

    if (job.opts.repeat && 'key' in job.opts.repeat) {
      await queue.removeRepeatableByKey(`${job.opts.repeat?.key}`);
    }
  }

  return worker;
}

type CronDescription = Omit<CronDescriptionType, 'running'> & {
  name: string;
};

export async function formatCron(queue: Queue, job: RepeatableJob): Promise<CronDescription> {
  const jobs = (await queue.getJobs(['completed'])).filter((j) => j.name === job.name);
  const lastCompletedJob = jobs.at(0);
  const lastRun = lastCompletedJob?.processedOn ? new Date(lastCompletedJob.processedOn) : null;

  return {
    name: job.name as CronNameType,
    lastRun,
    nextRun: new Date(job.next),
  };
}
