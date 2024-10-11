import { join } from 'node:path';

import { omit } from 'lodash';
import {
  Queue,
  Worker,
  FlowProducer,
  type Job,
} from 'bullmq';

import { Type, type Static } from '~/lib/typebox';
import type { Namespace, Task } from '~/lib/prisma';
import config from '~/lib/config';
import { formatInterval } from '~/lib/utils';
import { appLogger } from '~/lib/logger';
import { ConflictError, NotFoundError } from '~/types/errors';

import { buildPagination } from '~/models/pagination';

const {
  redis,
  workers: { concurrence, maxExecTime },
} = config;

const logger = appLogger.child({ scope: 'bull' });

export type GenerationData = {
  /**
   * The task
   */
  task: Task,
  /**
   * The namespace of the task
   */
  namespace: Omit<Namespace, 'fetchLogin' | 'fetchOptions'>,
  /**
   * The origin of the generation (can be username, or method (auto, etc.))
   */
  origin: string,
  /**
   * Should write generation in task history (also disable first level of debug)
   */
  writeActivity?: boolean,
  /**
   * Period overriding
   */
  customPeriod?: { start: string, end: string },
  /**
   * Enable second level of debug
   */
  debug?: boolean
};

export type MailQueueData = {
  namespaceId: string,
  error?: {
    file: string,
    filename: string,
    contact: string,
    date: string,
  }
};

//! Keep in sync with mail service
export type MailResult = {
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
    recurrence: Task['recurrence'],
    name: string,
    targets: string[],
  }
  namespace: string,
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

const {
  PaginationQuery: JobPaginationQuery,
} = buildPagination({
  model: {} as Record<keyof Job, unknown>,

  primaryKey: 'id',
  previousType: Type.String(),
  sortKeys: [],
});

export { JobPaginationQuery };
export type JobPaginationQueryType = Static<typeof JobPaginationQuery>;

const workers: Worker[] = [];

let flowProducer: FlowProducer | undefined;
const queues = {
  generation: undefined as Queue<GenerationData> | undefined,
  mail: undefined as Queue<MailQueueData> | undefined,
};

type Queues = keyof typeof queues;

export const initQueues = (skipLogs = false, skipWorker = false) => {
  try {
    if (!skipLogs) { logger.debug('Init started'); }
    const start = new Date();

    flowProducer = new FlowProducer({ connection: redis });
    if (!skipLogs) { logger.debug('Created flow producer'); }

    queues.generation = new Queue<GenerationData>('ezReeport.report-generation', { connection: redis });
    if (!skipLogs) {
      queues.generation.on('error', (err) => {
        logger.error({
          err,
          queue: queues.generation?.name,
          msg: 'Failed with an unexpected error',
        });
      });

      logger.debug({
        queue: queues.generation.name,
        msg: 'Created queue',
      });
    }

    queues.mail = new Queue<MailQueueData>('ezReeport.mail-send', { connection: redis });
    if (!skipLogs) {
      logger.debug({
        queue: queues.mail.name,
        msg: 'Created queue',
      });
    }

    if (!skipWorker) {
      const generationWorker = new Worker(
        queues.generation.name,
        join(__dirname, 'jobs/generateReport.js'),
        {
          connection: redis,
          limiter: {
            max: concurrence,
            duration: maxExecTime,
          },
        },
      );

      if (!skipLogs) {
        generationWorker.on('completed', (job) => {
          logger.debug({
            queue: queues.generation?.name,
            job: job?.id,
            msg: 'Job completed',
          });
        });
        generationWorker.on('failed', (job, err) => {
          logger.error({
            queue: queues.generation?.name,
            job: job?.id,
            err,
            msg: 'Job failed',
          });
        });
        generationWorker.on('error', (err) => {
          logger.error({
            queue: queues.generation?.name,
            err,
            msg: 'Worker failed',
          });
        });
      }

      workers.push(generationWorker);

      if (!skipLogs) {
        logger.debug({
          queue: queues.generation.name,
          worker: {
            name: generationWorker.name,
            concurrency: concurrence,
            maxExecTime,
          },
          msg: 'Created worker',
        });
      }
    }

    if (!skipLogs) {
      logger.info({
        initDuration: formatInterval({ start, end: new Date() }),
        initDurationUnit: 's',
        msg: 'Init completed',
      });
    }
  } catch (error) {
    if (!skipLogs) {
      logger.error(error, 'Init failed');
    }
  }
};

/**
 * Check if given name is a valid queue name
 *
 * @param name Given name
 *
 * @returns Given name is a valid queue name
 */
const isQueue = (name: string): name is Queues => Object.keys(queues).includes(name);

type GetOneQueueOverloads = {
  (name: Queues): Exclude<(typeof queues)[Queues], undefined>
  (name: string): Exclude<(typeof queues)[Queues], undefined>
};

/**
 * Get one specific queue
 *
 * @param name The possible name of the queue
 *
 * @returns The wanted queue
 */
const getOneQueue: GetOneQueueOverloads = (name) => {
  if (!isQueue(name)) {
    throw new NotFoundError(`Queue "${name}" not found`);
  }
  const q = queues[name];
  if (!q) {
    throw new Error('queues are not initialized');
  }
  return q;
};

/**
 * Get current queues
 *
 * @returns The queues infos
 */
export const getQueues = () => Promise.all(
  Object.keys(queues)
    .map(
      async (name) => ({
        name,
        status: await getOneQueue(name).isPaused() ? 'paused' : 'active',
      }),
    ),
);

/**
 * Add task to generation queue
 *
 * @param data The data
 *
 * @returns When task is placed in queue
 */
export const addTaskToGenQueue = (data: GenerationData) => {
  if (!flowProducer) {
    throw new Error('queues are not initialized');
  }

  return flowProducer.add({
    name: 'mail',
    queueName: getOneQueue('mail').name,
    data: { namespaceId: data.task.namespaceId },
    children: [
      {
        name: 'generate',
        data: omit(data, ['task.activity']),
        queueName: getOneQueue('generation').name,
      },
    ],
  });
};

export const addErrorToMailQueue = (data: Exclude<MailQueueData['error'], undefined>) => {
  if (!flowProducer) {
    throw new Error('queues are not initialized');
  }

  return flowProducer.add({
    name: 'mail',
    queueName: getOneQueue('mail').name,
    data: {
      namespaceId: process.env.NODE_ENV ?? 'dev',
      error: data,
    },
  });
};

/**
 * Pause the whole queue
 *
 * @param queue The queue name
 *
 * @throw If queue not found
 *
 * @returns When the queue is paused
 */
export const pauseQueue = (queue: string) => getOneQueue(queue).pause();

/**
 * Resume the whole queue
 *
 * @param queue The queue name
 *
 * @throw If queue not found
 *
 * @returns When the queue is resumed
 */
export const resumeQueue = (queue: string) => getOneQueue(queue).resume();

/**
 * Format bull job
 *
 * @param job bull job
 *
 * @returns formatted job
 */
const formatJob = async (job: Job<GenerationData | MailQueueData>) => ({
  id: job.id,
  data: job.data,
  result: job.returnvalue?.res,
  progress: job.progress,
  added: new Date(job.timestamp),
  started: job.processedOn && new Date(job.processedOn),
  ended: job.finishedOn && new Date(job.finishedOn),
  attempts: job.attemptsMade + 1,
  status: await job.getState(),
});

/**
 * Get count of jobs in queue
 *
 * @param queue The queue name
 *
 * @returns The count of jobs
 */
export const getCountJobs = async (queue: string) => {
  const jobs = await getOneQueue(queue).getJobs(
    ['active', 'completed', 'delayed', 'failed', 'paused', 'waiting'],
  );

  return jobs.length;
};

/**
 * Get jobs of a queue
 *
 * @param queue The queue name
 *
 * @throw If queue not found
 *
 * @returns The jobs in queue
 */
export const getJobs = async (
  queue: string,
  jobOpts?: JobPaginationQueryType,
) => {
  const rawJobs = await getOneQueue(queue).getJobs(
    ['active', 'completed', 'delayed', 'failed', 'paused', 'waiting'],
  );
  let jobs = rawJobs;
  if (jobOpts?.previous) {
    const index = rawJobs.findIndex(({ id }) => id === jobOpts.previous) + 1;
    if (!index) {
      jobs = [];
    } else {
      jobs = rawJobs.slice(index);
    }
  }
  jobs = jobs.slice(0, jobOpts?.count ?? 15);
  // TODO: custom sort

  return Promise.all(jobs.map(formatJob));
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
  const job = await getOneQueue(queue).getJob(id);
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
  const job = await getOneQueue(queue).getJob(id);
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
    msg: 'Job restarted',
  });

  return formatJob(
    await getOneQueue(queue).getJob(id) ?? job,
  );
};

/**
 * Ping redis host to check if it's alive
 *
 * @returns If ping is successful (200) or not
 */
export const redisPing = async () => {
  const queue = queues.generation || queues.mail;
  if (!queue) {
    throw new Error('queues are not initialized');
  }
  const res = await (await queue.client).ping();
  return res === 'PONG' ? 200 : false;
};
