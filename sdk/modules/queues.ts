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
 * Needs `perms.queues.read_all`
 *
 * @returns All queues' names
 */
export const getAllQueues = () => axios.$get<string[]>('/queues');

/**
 * Get queue info
 *
 * Needs `perms.queues.read_one`
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const getQueue = <Data, Result>(queueName: Job<Data>['queue']) => axios.$get<Queue<Data, Result>>(`/queues/${queueName}`);

/**
 * Pause queue
 *
 * Needs `perms.queues.update`
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const pauseQueue = <Data, Result>(queueName: Job<Data>['queue']) => axios.$put<Queue<Data, Result>>(`/queues/${queueName}/pause`);

/**
 * Resume queue
 *
 * Needs `perms.queues.update`
 *
 * @param queueName Name of the queue
 *
 * @returns queue info
 */
export const resumeQueue = <Data, Result>(queueName: Job<Data>['queue']) => axios.$put<Queue<Data, Result>>(`/queues/${queueName}/resume`);

/**
 * Get job info
 *
 * Needs `perms.queues.jobs.read`
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 *
 * @returns Job full info
 */
export const getJob = <Data, Result>(queueName: Job<Data>['queue'], jobId: Job<Data>['id']) => axios.$get<FullJob<Data, Result>>(`/queues/${queueName}/${jobId}`);

/**
 * Retry job that failed
 *
 * Needs `perms.queues.jobs.update`
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 *
 * @returns queue info
 */
export const retryJob = <Data, Result>(queueName: Job<Data>['queue'], jobId: Job<Data>['id']) => axios.$post<FullJob<Data, Result>>(`/queues/${queueName}/${jobId}/retry`);
