import { parseISO } from 'date-fns';
import axios, { type ApiResponse } from '../lib/axios';

export interface Job<Data> {
  id: number | string,
  queue: string,
  data: Data,
}

type JobStatus =
  | 'completed'
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'failed'
  | 'paused'
  | 'stuck';

interface RawFullJob<Data, Result> {
  id: Job<Data>['id'],
  data: Job<Data>['data'],
  result?: Result,
  progress: number,
  added: string, // Date
  started?: string, // Date
  ended?: string, // Date
  attemps: number,
  status: JobStatus,
}

export interface FullJob<Data, Result> extends Omit<RawFullJob<Data, Result>, 'added' | 'started' | 'ended'> {
  added: Date,
  started?: Date,
  ended?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param job Raw job
 *
 * @returns Parsed job
 */
const parseFullJob = <Data, Result>(
  job: RawFullJob<Data, Result>,
): FullJob<Data, Result> => ({
    ...job,
    added: parseISO(job.added),
    started: job.started ? parseISO(job.started) : undefined,
    ended: job.ended ? parseISO(job.ended) : undefined,
  });

interface RawQueue<Data, Result> {
  status: 'paused' | 'active',
  jobs: RawFullJob<Data, Result>[]
}

export interface Queue<Data, Result> extends Omit<RawQueue<Data, Result>, 'jobs'> {
  jobs: FullJob<Data, Result>[]
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param queue Raw queue
 *
 * @returns Parsed queue
 */
const parseQueue = <Data, Result>(
  queue: RawQueue<Data, Result>,
): Queue<Data, Result> => ({
    ...queue,
    jobs: queue.jobs.map(parseFullJob),
  });

/**
 * Get all available queues
 *
 * Needs `queues-get` permission
 *
 * @returns All queues' names
 */
export const getAllQueues = () => axios.$get<string[]>('/queues');

/**
 * Get queue info
 *
 * Needs `queues-get-queue` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const getQueue = async <Data, Result>(
  queueName: Job<Data>['queue'],
): Promise<ApiResponse<Queue<Data, Result>>> => {
  const { content, ...response } = await axios.$get<RawQueue<Data, Result>>(`/queues/${queueName}`);

  return {
    ...response,
    content: parseQueue(content),
  };
};

/**
 * Pause queue
 *
 * Needs `queues-put-queue-pause` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const pauseQueue = async <Data, Result>(
  queueName: Job<Data>['queue'],
): Promise<ApiResponse<Queue<Data, Result>>> => {
  const { content, ...response } = await axios.$put<RawQueue<Data, Result>>(`/queues/${queueName}/pause`);
  return {
    ...response,
    content: parseQueue(content),
  };
};

/**
 * Resume queue
 *
 * Needs `queues-put-queue-resume` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const resumeQueue = async <Data, Result>(
  queueName: Job<Data>['queue'],
): Promise<ApiResponse<Queue<Data, Result>>> => {
  const { content, ...response } = await axios.$put<RawQueue<Data, Result>>(`/queues/${queueName}/resume`);
  return {
    ...response,
    content: parseQueue(content),
  };
};

/**
 * Get job info
 *
 * Needs `queues-get-queue-jobId` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Job full info
 */
export const getJob = async <Data, Result>(
  queueName: Job<Data>['queue'],
  jobId: Job<Data>['id'],
  institution?: string,
): Promise<ApiResponse<FullJob<Data, Result>>> => {
  const { content, ...response } = await axios.$get<RawFullJob<Data, Result>>(`/queues/${queueName}/${jobId}`, { params: { institution } });
  return {
    ...response,
    content: parseFullJob(content),
  };
};

/**
 * Retry job that failed
 *
 * Needs `queues-post-queue-jobId-retry` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns queue info
 */
export const retryJob = async <Data, Result>(
  queueName: Job<Data>['queue'],
  jobId: Job<Data>['id'],
  institution?: string,
): Promise<ApiResponse<FullJob<Data, Result>>> => {
  const { content, ...response } = await axios.$post<RawFullJob<Data, Result>>(`/queues/${queueName}/${jobId}/retry`, { params: { institution } });
  return {
    ...response,
    content: parseFullJob(content),
  };
};
