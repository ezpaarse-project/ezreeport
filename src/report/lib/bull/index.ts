import type { Task } from '@prisma/client';
import Queue, { type Job } from 'bull';
import { join } from 'path';
import config from '../config';
import logger from '../logger';

const { concurrence, ...redis } = config.get('redis');

export type GenerationData = {
  task: Task,
  origin: string,
  writeHistory?: boolean,
  debug?: boolean
};

const generationQueue = new Queue<GenerationData>('report generation', { redis });

generationQueue.on('failed', (job, err) => {
  if (job.attemptsMade === job.opts.attempts) {
    logger.error(`[bull] ${err.message}`);
  }
});

generationQueue.process(concurrence, join(__dirname, 'jobs/generateReport.ts'));

const queues = {
  generation: generationQueue,
};

export const queuesNames = Object.keys(queues);

export type Queues = keyof typeof queues;

/**
 * Add task to generation queue
 *
 * @param task The task
 * @param origin The origin of the generation (can be username, or method (auto, etc.))
 * @param writeHistory Should write generation in task history (also disable first level of debug)
 * @param debug Enable second level of debug
 *
 * @returns When task is placed in queue
 */
export const addTaskToQueue = (
  task: Task,
  origin: string,
  writeHistory = true,
  debug = false,
) => queues.generation.add({
  task, origin, writeHistory, debug,
});

/**
 * Format bull job
 *
 * @param job bull job
 *
 * @returns formated job
 */
const formatJob = async (job: Job<GenerationData>) => ({
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
 * @returns When the queue is paused
 */
export const pauseQueue = (queue: Queues) => queues[queue].pause();

/**
 * Resume the whole queue
 *
 * @param queue The queue name
 *
 * @returns When the queue is resumed
 */
export const resumeQueue = (queue: Queues) => queues[queue].resume();

// TODO[feat]: pagination
/**
 * Get info about specific queue
 *
 * @param queue The queue name
 *
 * @returns The queue info
 */
export const getJobs = async (queue: Queues) => {
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
 * @returns The job info
 */
export const getJob = async (queue: Queues, id: string) => {
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
 *
 * @returns The job info
 */
export const retryJob = async (queue: Queues, id: string) => {
  const job = await queues[queue].getJob(id);
  if (!job) {
    return null;
  }

  await job.retry();

  return formatJob(job);
};
