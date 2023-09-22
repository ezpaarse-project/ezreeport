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

export interface InputQueue {
  status: Queue['status'],
}

/**
 * Get all available queues
 *
 * Needs `general.queues-get` permission
 *
 * @returns All queues' names
 */
export const getAllQueues = () => axios.$get<Queue[]>('/queues');

/**
 * Get specific queue
 *
 * Needs `general.queues-get-queue` permission
 *
 * @param queueOrName Queue or queue's name
 *
 * @returns queue info
 */
export const getQueue = async (queueOrName: Queue | Queue['name']): Promise<ApiResponse<Queue>> => {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  return axios.$get<Queue>(`/queues/${queueName}`);
};

/**
 * Update specific queue
 *
 * Needs `general.queues-patch-queue` permission
 *
 * @param queueOrName Queue or queue's name
 *
 * @returns queue info
 */
export const updateQueue = async (queue: Partial<InputQueue> & { name: Queue['name'] }): Promise<ApiResponse<Queue>> => {
  const { name, ...data } = queue;
  return axios.$patch<Queue>(`/queues/${name}`, data);
};

/**
 * Pause queue
 *
 * Needs `general.queues-put-queue-pause` permission
 *
 * @param queueOrName Queue or queue's name
 *
 * @deprecated Use `updateQueue` instead
 *
 * @returns queue info
 */
export const pauseQueue = async (queueOrName: Queue | Queue['name']): Promise<ApiResponse<Queue>> => {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  return axios.$put<Queue>(`/queues/${queueName}/pause`);
};

/**
 * Resume queue
 *
 * Needs `general.queues-put-queue-resume` permission
 *
 * @param queueOrName Queue or queue's name
 *
 * @deprecated Use `updateQueue` instead
 *
 * @returns queue info
 */
export const resumeQueue = async (queueOrName: Queue | Queue['name']): Promise<ApiResponse<Queue>> => {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  return axios.$put<Queue>(`/queues/${queueName}/resume`);
};

/**
 * Get queue info
 *
 * Needs `general.queues-get-queue-jobs` permission
 *
 * @param queueOrName Queue or queue's name
 *
 * @returns queue info
 */
export const getQueueJobs = async <Data, Result>(
  queueOrName: Queue | Queue['name'],
  paginationOpts?: { previous?: Job<Data>['id'], count?: number },
): Promise<PaginatedApiResponse<FullJob<Data, Result>[]>> => {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
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
 * Needs `namespaces[namespaceId].queues-get-queue-jobs-jobId` permission
 *
 * @param queueOrName Queue or queue's name where job is
 * @param jobOrId Job or job's id in queue
 * @param namespaces
 *
 * @returns Job full info
 */
export const getJob = async <Data, Result>(
  queueOrName: Queue | Queue['name'],
  jobOrId: Job<Data> | Job<Data>['id'],
  namespaces?: string[],
): Promise<ApiResponse<FullJob<Data, Result>>> => {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  const jobId = typeof jobOrId === 'string' || typeof jobOrId === 'number' ? jobOrId : jobOrId.id;

  const { content, ...response } = await axios.$get<RawFullJob<Data, Result>>(`/queues/${queueName}/jobs/${jobId}`, { params: { namespaces } });
  return {
    ...response,
    content: parseFullJob(content),
  };
};

/**
 * Retry job that failed
 *
 * Needs `namespaces[namespaceId].queues-post-queue-jobs-jobId-retry` permission
 *
 * @param queueOrName Queue or queue's name where job is
 * @param jobOrId Job or job's id in queue
 * @param namespaces
 *
 * @returns queue info
 */
export const retryJob = async <Data, Result>(
  queueOrName: Queue | Queue['name'],
  jobOrId: Job<Data> | Job<Data>['id'],
  namespaces?: string[],
): Promise<ApiResponse<FullJob<Data, Result>>> => {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  const jobId = typeof jobOrId === 'string' || typeof jobOrId === 'number' ? jobOrId : jobOrId.id;

  const { content, ...response } = await axios.$post<RawFullJob<Data, Result>>(`/queues/${queueName}/jobs/${jobId}/retry`, { params: { namespaces } });
  return {
    ...response,
    content: parseFullJob(content),
  };
};
