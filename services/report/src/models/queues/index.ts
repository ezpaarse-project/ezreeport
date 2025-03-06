import { join } from 'node:path';

import type { Queue, Worker } from 'bullmq';

import {
  createQueue,
  createWorker,
  getJobs,
  formatJob,
  getCountOfJobs,
  pingQueue,
} from '~/lib/bull';
import { formatISO } from '~/lib/date-fns';
import { appLogger } from '~/lib/logger';
import { formatInterval } from '~/lib/utils';

import { buildPaginatedRequest } from '~/models/pagination';
import type { PaginationType } from '~/models/pagination/types';

import type {
  FormattedJobType,
  GenerationDataType,
  MailErrorDataType,
  MailReportType,
  QueueDataType,
  QueueDescriptionType,
  QueueNameType,
} from '~/models/queues/types';

import { ConflictError } from '~/types/errors';

const logger = appLogger.child({ scope: 'models', model: 'queues' });

/**
 * Workers initialized
 */
const workers: Worker[] = [];
/**
 * Map of initialized queues
 */
const queues: { [type in QueueNameType]?: Queue<QueueDataType[type]> } = {};

/**
 * Initialize queues
 *
 * @param skipLogs Skip logs
 * @param skipWorker Skip worker creation
 */
export function initQueues(skipLogs = false, skipWorker = false) {
  if (!skipLogs) { logger.debug('Init started'); }
  const start = new Date();

  try {
    queues.generation = createQueue('generation', 'ezReeport.report-generation', !skipLogs ? logger : undefined);
    queues.mail = createQueue('mail', 'ezReeport.mail-send', !skipLogs ? logger : undefined);

    if (queues.generation && !skipWorker) {
      const w = createWorker(queues.generation, join(__dirname, 'jobs/generate.entrypoint.js'), undefined, !skipLogs ? logger : undefined);
      workers.push(w);
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
 * Format a queue
 *
 * @param queue The queue
 *
 * @returns
 */
async function formatQueue(q: Queue<QueueDataType[QueueNameType]>): Promise<QueueDescriptionType> {
  const [name, queue] = Object.entries(queues).find(([, qu]) => qu.name === q.name) ?? [];
  if (!name || !queue) {
    throw new Error('queues are not initialized');
  }

  const isPaused = await queue.isPaused();
  return {
    name: name as QueueNameType,
    status: isPaused ? 'paused' : 'active',
  };
}

/**
 * Get list of queues with their status
 *
 * @returns List of queues
 */
export function getAllQueues() {
  return Promise.all(Object.values(queues).map(formatQueue));
}

/**
 * Pause/Unpause a queue
 *
 * @param name Name of the queue
 *
 * @returns The updated queue
 */
export async function toggleQueue(name: QueueNameType) {
  const queue = queues[name];
  if (!queue) {
    throw new Error('queues are not initialized');
  }

  const paused = await queue.isPaused();
  if (!paused) {
    await queue.pause();
  } else {
    await queue.resume();
  }

  return formatQueue(queue);
}

/**
 * Get list of jobs of queue
 *
 * @param name Queue name
 * @param pagination Pagination options
 *
 * @returns Paginated list of jobs
 */
export async function getJobsOfQueue(
  name: QueueNameType,
  pagination?: Omit<PaginationType, 'sort'>,
): Promise<FormattedJobType[]> {
  const queue = queues[name];
  if (!queue) {
    throw new Error('queues are not initialized');
  }

  const query = buildPaginatedRequest(pagination);

  const jobs = await getJobs(
    queue,
    query.skip,
    query.skip + (query.take ?? 0),
    pagination?.order === 'asc',
  );

  return Promise.all(jobs.map(formatJob));
}

/**
 * Get count of jobs in queue
 *
 * @param name Queue name
 *
 * @returns Count of jobs
 */
export function countJobs(name: QueueNameType) {
  const queue = queues[name];
  if (!queue) {
    throw new Error('queues are not initialized');
  }

  return getCountOfJobs(queue);
}

/**
 * Get a specific job
 *
 * @param name Name of the queue
 * @param id Id of the job
 *
 * @returns Job
 */
export async function getJob(name: QueueNameType, id: string) {
  const queue = queues[name];
  if (!queue) {
    throw new Error('queues are not initialized');
  }

  const job = await queue.getJob(id);
  return job ? formatJob(job) : null;
}

/**
 * Restart a job
 *
 * @param name Name of the queue
 * @param id Id of the job
 *
 * @returns Job
 */
export async function restartJob(name: QueueNameType, id: string) {
  const queue = queues[name];
  if (!queue) {
    throw new Error('queues are not initialized');
  }

  const job = await queue.getJob(id);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  if (state !== 'completed' && state !== 'failed') {
    throw new ConflictError(`Job '${id}' must completed or failed to be reprocessed`);
  }
  await job.retry(state);

  logger.debug({
    job: id,
    queue: name,
    action: 'Restarted',
    msg: 'Restarted',
  });

  return getJob(name, id);
}

/**
 * Queue report generation
 *
 * @param data Data needed for generation
 *
 * @returns Flow that will be executed
 */
export function queueGeneration(data: GenerationDataType) {
  if (!queues.generation) {
    throw new Error('queues are not initialized');
  }

  const job = queues.generation.add('generate', data);

  logger.debug({
    queue: 'generate',
    action: 'Queued',
    msg: 'Report queued for generation',
  });

  return job;
}

export function queueMail(data: MailReportType) {
  if (!queues.mail) {
    throw new Error('queues are not initialized');
  }

  const job = queues.mail.add('mail', data);

  logger.debug({
    queue: 'generate',
    action: 'Queued',
    msg: 'Report queued for mail',
  });

  return job;
}

/**
 * Queue error to mail
 *
 * @param data Data needed for error
 * @param date Date of the error
 *
 * @returns Flow that will be executed
 */
export function queueError(data: MailErrorDataType, date = new Date()) {
  if (!queues.mail) {
    throw new Error('queues are not initialized');
  }

  const job = queues.mail.add('mail', {
    env: process.env.NODE_ENV ?? 'dev',
    error: data,
    date: formatISO(date),
  });

  logger.debug({
    queue: 'mail',
    action: 'Queued',
    msg: 'Error queued to mail',
  });

  return job;
}

/**
 * Ping redis host to check if it's alive
 *
 * @returns 200 if ping is successful, false otherwise
 */
export function pingRedisThroughQueue() {
  if (!queues.generation) {
    throw new Error('queues are not initialized');
  }
  return pingQueue(queues.generation);
}
