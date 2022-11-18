import type { Recurrence, Task } from '@prisma/client';
import Queue, { type Job } from 'bull';
import { join } from 'path';
import { NotFoundError } from '../../types/errors';
import config from '../config';
import logger from '../logger';

const { concurrence, ...redis } = config.get('redis');

export type GenerationData = {
  /**
   * The task
   */
  task: Task,
  /**
   * The origin of the generation (can be username, or method (auto, etc.))
   */
  origin: string,
  /**
   * Should write generation in task history (also disable first level of debug)
   */
  writeHistory?: boolean,
  /**
   * Enable second level of debug
   */
  debug?: boolean
};

export type MailData = {
  /**
   * If task succeed or failed
   */
  success: boolean,
  /**
   * The file data (in base64)
   */
  file: string,
  /**
   * The task's data
   */
  task: {
    recurrence: Recurrence,
    name: string,
    targets: string[],
    institution: string,
  }
  /**
   * The generation date
   */
  date: string,
  /**
   * The http url to get the file
   */
  url: string,
};

const generationQueue = new Queue<GenerationData>('report generation', { redis });
const mailQueue = new Queue<MailData>('mail send', { redis });

generationQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull] "generation" failed with error: ${err.message}`);
  }
});
mailQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull] "mail" failed with error: ${err.message}`);
  }
});

generationQueue.process(concurrence, join(__dirname, 'jobs/generateReport.ts'));

const queues = {
  generation: generationQueue,
  mail: mailQueue,
};

export const queuesNames = Object.keys(queues);

type Queues = keyof typeof queues;

/**
 * Check if given name is a valid queue name
 *
 * @param name Given name
 *
 * @returns Given name is a valid queue name
 */
const isQueue = (name: string): name is Queues => Object.keys(queues).includes(name);

/**
 * Add task to generation queue
 *
 * @param data The data
 *
 * @returns When task is placed in queue
 */
export const addTaskToQueue = (data: GenerationData) => queues.generation.add(data);

/**
 * Add task to mail queue
 *
 * @param data The data
 *
 * @returns When task is placed in queue
 */
export const addReportToQueue = (data: MailData) => queues.mail.add(data);

/**
 * Format bull job
 *
 * @param job bull job
 *
 * @returns formated job
 */
const formatJob = async (job: Job<GenerationData | MailData>) => ({
  id: job.id,
  data: job.data,
  progress: job.progress(),
  added: new Date(job.timestamp),
  started: job.processedOn && new Date(job.processedOn),
  ended: job.finishedOn && new Date(job.finishedOn),
  attemps: job.attemptsMade + 1,
  status: await job.getState(),
});

/**
 * Pause the whole queue
 *
 * @param queue The queue name
 *
 * @throw If queue not found
 *
 * @returns When the queue is paused
 */
export const pauseQueue = (queue: string) => {
  if (!isQueue(queue)) {
    throw new NotFoundError(`Queue "${queue}" not found`);
  }
  return queues[queue].pause();
};

/**
 * Resume the whole queue
 *
 * @param queue The queue name
 *
 * @throw If queue not found
 *
 * @returns When the queue is resumed
 */
export const resumeQueue = (queue: string) => {
  if (!isQueue(queue)) {
    throw new NotFoundError(`Queue "${queue}" not found`);
  }
  return queues[queue].resume();
};

// TODO[feat]: pagination
/**
 * Get info about specific queue
 *
 * @param queue The queue name
 *
 * @throw If queue not found
 *
 * @returns The queue info
 */
export const getJobs = async (queue: string) => {
  if (!isQueue(queue)) {
    throw new NotFoundError(`Queue "${queue}" not found`);
  }

  const rawJobs = await queues[queue].getJobs(['active', 'delayed', 'paused', 'waiting']);
  return {
    status: await queues[queue].isPaused() ? 'paused' : 'active',
    jobs: await Promise.all(rawJobs.map(formatJob)),
  };
};

/**
 * Get info about specific job
 *
 * @param queue The queue name
 * @param id The job id
 *
 * @throw If queue not found
 *
 * @returns The job info
 */
export const getJob = async (queue: string, id: string) => {
  if (!isQueue(queue)) {
    throw new NotFoundError(`Queue "${queue}" not found`);
  }

  const job = await queues[queue].getJob(id);
  if (!job) {
    return null;
  }

  return formatJob(job);
};

/**
 * Retry job that failed
 *
 * @param queue The queue name
 * @param id The job id
 *
 * @throw If job wasn't failed
 * @throw If queue not found
 *
 * @returns The job info
 */
export const retryJob = async (queue: string, id: string) => {
  if (!isQueue(queue)) {
    throw new NotFoundError(`Queue "${queue}" not found`);
  }

  const job = await queues[queue].getJob(id);
  if (!job) {
    return null;
  }

  await job.retry();

  return formatJob(job);
};
