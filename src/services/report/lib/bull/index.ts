import Queue, { type Job } from 'bull';
import { join } from 'path';
import type { Recurrence, Task } from '~/lib/prisma';
import config from '~/lib/config';
import { sendError } from '~/lib/elastic/apm';
import logger from '~/lib/logger';
import { NotFoundError } from '~/types/errors';

const { ...redis } = config.get('redis');
const { concurrence, maxExecTime } = config.get('workers');

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
   * Period overriding
   */
  customPeriod?: { start: string, end: string },
  /**
   * Enable second level of debug
   */
  debug?: boolean
};

//! Keep in sync with mail service
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
    id: string,
    recurrence: Recurrence,
    name: string,
    targets: string[],
    institution: string,
  }
  /**
   * The email of the user that was used for generation
   */
  contact?: string,
  /**
   * The generation date
   */
  date: string,
  /**
   * The http url to get the file
   */
  url: string,
};

export const baseQueueOptions: Queue.QueueOptions = {
  redis,
  limiter: {
    max: concurrence,
    duration: maxExecTime,
  },
};

const generationQueue = new Queue<GenerationData>('ezReeport.report-generation', baseQueueOptions);
const mailQueue = new Queue<MailData>('ezReeport.mail-send', baseQueueOptions);

generationQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull-job] "generation" failed with error: ${err.message}`);
    sendError(err);
  }
});
generationQueue.on('error', (err) => {
  logger.error(`[bull-queue] "generation" failed with error: ${err.message}`);
});
mailQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull-job] "mail" failed with error: ${err.message}`);
  }
});
mailQueue.on('error', (err) => {
  logger.error(`[bull-queue] "mail" failed with error: ${err.message}`);
});

generationQueue.process(join(__dirname, 'jobs/generateReport.ts'));

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
  result: job.returnvalue,
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