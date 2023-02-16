import { parseISO } from 'date-fns';
import axios, { axiosWithErrorFormatter, type PaginatedApiResponse, type ApiResponse } from '../lib/axios';

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
  attempts: number,
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

export interface Queue {
  status: 'paused' | 'active',
  name: string,
}

/**
 * Get all available queues
 *
 * Needs `queues-get` permission
 *
 * @returns All queues' names
 */
export const getAllQueues = () => axios.$get<Queue[]>('/queues');

/**
 * Pause queue
 *
 * Needs `queues-put-queue-pause` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const pauseQueue = async (queueName: string): Promise<ApiResponse<Queue>> => axios.$put<Queue>(`/queues/${queueName}/pause`);

/**
 * Resume queue
 *
 * Needs `queues-put-queue-resume` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const resumeQueue = async (queueName: string): Promise<ApiResponse<Queue>> => axios.$put<Queue>(`/queues/${queueName}/resume`);

/**
 * Get queue info
 *
 * Needs `queues-get-queue-jobs` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const getQueueJobs = async <Data, Result>(
  queueName: string,
  paginationOpts?: { previous?: Job<Data>['id'], count?: number },
): Promise<PaginatedApiResponse<FullJob<Data, Result>[]>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawFullJob<Data, Result>[]>, 'get'>(
    'get',
    `/queues/${queueName}/jobs`,
    {
      params: paginationOpts,
    },
  );

  return {
    ...response,
    content: content.map(parseFullJob),
  };
};

/**
 * Get job info
 *
 * Needs `queues-get-queue-jobs-jobId` permission
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
  const { content, ...response } = await axios.$get<RawFullJob<Data, Result>>(`/queues/${queueName}/jobs/${jobId}`, { params: { institution } });
  return {
    ...response,
    content: parseFullJob(content),
  };
};

/**
 * Retry job that failed
 *
 * Needs `queues-post-queue-jobs-jobId-retry` permission
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
  const { content, ...response } = await axios.$post<RawFullJob<Data, Result>>(`/queues/${queueName}/jobs/${jobId}/retry`, { params: { institution } });
  return {
    ...response,
    content: parseFullJob(content),
  };
};
