import axios from '../lib/axios';

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

export interface FullJob<Data, Result> {
  id: Job<Data>['id'],
  data: Job<Data>['data'],
  result?: Result,
  progress: number,
  added: string, // Date
  started: string, // Date
  ended: string, // Date
  attemps: number,
  status: JobStatus,
}

export interface Queue<Data, Result> {
  status: 'paused' | 'active',
  jobs: FullJob<Data, Result>[]
}

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
export const getQueue = <Data, Result>(queueName: Job<Data>['queue']) => axios.$get<Queue<Data, Result>>(`/queues/${queueName}`);

/**
 * Pause queue
 *
 * Needs `queues-put-queue-pause` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const pauseQueue = <Data, Result>(queueName: Job<Data>['queue']) => axios.$put<Queue<Data, Result>>(`/queues/${queueName}/pause`);

/**
 * Resume queue
 *
 * Needs `queues-put-queue-resume` permission
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const resumeQueue = <Data, Result>(queueName: Job<Data>['queue']) => axios.$put<Queue<Data, Result>>(`/queues/${queueName}/resume`);

/**
 * Get job info
 *
 * Needs `queues-get-queue-jobId` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution
 *
 * @returns Job full info
 */
export const getJob = <Data, Result>(
  queueName: Job<Data>['queue'],
  jobId: Job<Data>['id'],
  institution?: string,
) => axios.$get<FullJob<Data, Result>>(`/queues/${queueName}/${jobId}`, { params: { institution } });

/**
 * Retry job that failed
 *
 * Needs `queues-post-queue-jobId-retry` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution
 *
 * @returns queue info
 */
export const retryJob = <Data, Result>(
  queueName: Job<Data>['queue'],
  jobId: Job<Data>['id'],
  institution?: string,
) => axios.$post<FullJob<Data, Result>>(`/queues/${queueName}/${jobId}/retry`, { params: { institution } });
