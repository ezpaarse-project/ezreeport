import {
  Queue,
  Worker,
  FlowProducer,
  type Job,
  type WorkerOptions,
} from 'bullmq';
import type { Logger } from 'pino';

import config from '~/lib/config';

import type { FormattedJobType } from '~/models/queues/types';

const {
  redis,
  workers: { concurrence, maxExecTime },
} = config;

/**
 * Create a new flow producer
 *
 * @param logger The logger to use
 *
 * @returns The flow producer
 */
export function createFlowProducer(logger?: Logger) {
  const flowProducer = new FlowProducer({ connection: redis });
  if (logger) { logger.debug('Created flow producer'); }
  return flowProducer;
}

/**
 * Create a new worker
 *
 * @param queue The queue to use
 * @param file The file to use as a processor
 * @param logger The logger to use
 *
 * @returns The worker
 */
export function createWorker(queue: Queue, file: string, limiter?: WorkerOptions['limiter'], logger?: Logger) {
  const workerLimiter = limiter || {
    max: concurrence,
    duration: maxExecTime,
  };

  const worker = new Worker(
    queue.name,
    file,
    {
      connection: redis,
      limiter: workerLimiter,
    },
  );

  if (logger) {
    const workerData = {
      name: worker.name,
      concurrency: workerLimiter.max,
      maxExecTime: workerLimiter.duration,
    };
    logger.debug({ queue: queue.name, worker: workerData, msg: 'Created worker' });

    worker.on('completed', (job) => {
      logger.debug({ queue: queue.name, job: job?.id, msg: 'Job completed' });
    });

    worker.on('failed', (job, err) => {
      logger.error({
        queue: queue.name,
        job: job?.id,
        msg: 'Job failed',
        err,
      });
    });

    worker.on('error', (err) => {
      logger.error({ err, queue: queue.name, msg: 'Worker failed' });
    });
  }

  return worker;
}

/**
 * Create a new queue
 *
 * @param name The queue name
 * @param fullName The queue full name
 * @param logger The logger to use
 *
 * @returns The queue
 */
export function createQueue<
  Name extends string,
  Data extends Record<string, unknown>,
>(name: Name, fullName: string, logger?: Logger) {
  const queue = new Queue<Data>(fullName, { connection: redis });

  if (logger) {
    logger.debug({ queue: queue.name, msg: 'Created queue' });

    queue.on('error', (err) => {
      logger.error({ err, queue: queue.name, msg: 'Failed with an unexpected error' });
    });
  }

  return queue;
}

/**
 * Format bull job
 *
 * @param job bull job
 *
 * @returns formatted job
 */
export async function formatJob(job: Job): Promise<FormattedJobType> {
  return {
    id: job.id ?? '',
    data: job.data,
    result: job.returnvalue?.res,
    progress: typeof job.progress === 'number' ? job.progress : 0,
    added: new Date(job.timestamp),
    started: job.processedOn != null ? new Date(job.processedOn) : undefined,
    ended: job.finishedOn != null ? new Date(job.finishedOn) : undefined,
    attempts: job.attemptsMade + 1,
    status: await job.getState(),
  };
}

/**
 * Get count of jobs in queue
 *
 * @param queue The queue
 *
 * @returns The count of jobs
 */
export async function getCountOfJobs(queue: Queue) {
  const count = await queue.getJobCountByTypes('active', 'completed', 'delayed', 'failed', 'paused', 'waiting');

  return count;
}

/**
 * Get jobs of a queue
 *
 * @param queue The queue
 *
 * @returns The jobs in queue
 */
export async function getJobs(queue: Queue, start?: number, end?: number, asc?: boolean) {
  const jobs = await queue.getJobs(
    ['active', 'completed', 'delayed', 'failed', 'paused', 'waiting'],
    start,
    end,
    asc,
  );

  return jobs;
}

/**
 * Ping redis host to check if it's alive
 *
 * @returns If ping is successful (200) or not
 */
export async function pingQueue(queue: Queue) {
  const res = await (await queue.client).ping();
  return res === 'PONG' ? 200 : false;
}
