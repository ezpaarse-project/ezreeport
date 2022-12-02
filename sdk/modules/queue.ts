import axios from '../lib/axios';

export interface Job<D> {
  id: number | string,
  queue: string,
  data: D,
}

type JobStatus =
  | 'completed'
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'failed'
  | 'paused'
  | 'stuck';

export interface FullJob<D> {
  id: Job<D>['id'],
  data: Job<D>['data'],
  progress: number,
  added: string, // Date
  started: string, // Date
  ended: string, // Date
  attemps: number,
  status: JobStatus,
}

export const getJob = <D>(queueName: Job<D>['queue'], jobId: Job<D>['id']) => axios.$get<FullJob<D>>(`/queues/${queueName}/${jobId}`);
