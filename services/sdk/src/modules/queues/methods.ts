import { parseISO } from 'date-fns';

import { client } from '~/lib/fetch';
import {
  apiRequestOptionsToQuery,
  type ApiResponse,
  type ApiRequestOptions,
  type ApiResponsePaginated,
  type SdkPaginated,
} from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import type {
  RawJob,
  Job,
  Queue,
  InputQueue,
} from './types';

const transformJob = <D = {}, R = {}>(job: RawJob<D, R>): Job<D, R> => ({
  ...job,
  added: parseISO(job.added),
  started: job.started ? parseISO(job.started) : undefined,
  ended: job.ended ? parseISO(job.ended) : undefined,
});

/**
 * Get all available queues
 *
 * @returns All queues' info
 */
export async function getAllQueues(): Promise<Queue[]> {
  const {
    content,
  } = await client.fetch<ApiResponse<Queue[]>>('/queues');

  return content;
}
assignPermission(getAllQueues, 'GET /queues');

/**
 * Get specific queue
 *
 * @param queueOrName Queue or queue's name
 *
 * @returns queue info
 */
export async function getQueue(queueOrName: Queue | string): Promise<Queue> {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;

  const {
    content,
  } = await client.fetch<ApiResponse<Queue>>(`/queues/${queueName}`);

  return content;
}
assignPermission(getQueue, 'GET /queues/:name');

/**
 * Update specific queue
 *
 * @param queueOrName Queue or queue's name
 *
 * @returns queue info
 */
export async function updateQueue(queue: Partial<InputQueue> & { name: string }): Promise<Queue> {
  const { name, ...data } = queue;

  const {
    content,
  } = await client.fetch<ApiResponse<Queue>>(`/queues/${name}`, {
    method: 'PATCH',
    body: data,
  });

  return content;
}
assignPermission(updateQueue, 'PATCH /queues/:name');

export type PaginatedJobs<D = {}, R = {}> = SdkPaginated<Job<D, R>>;

/**
 * Get jobs of a queue
 *
 * @param queueOrName Queue or queue's name
 *
 * @returns jobs in queue
 */
export async function getQueueJobs<D = {}, R = {}>(
  queueOrName: Queue | string,
  opts?: ApiRequestOptions,
): Promise<PaginatedJobs<D, R>> {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;

  const {
    content,
    meta: {
      total, count, page,
    },
  } = await client.fetch<ApiResponsePaginated<RawJob<D, R>>>(
    `/queues/${queueName}/jobs`,
    { query: apiRequestOptionsToQuery(opts) },
  );

  return {
    items: content.map(transformJob),
    total,
    count,
    page,
  };
}
assignPermission(getQueueJobs, 'GET /queues/:name/jobs');

/**
 * Get specific job
 *
 * @param queueOrName Queue or queue's name
 * @param jobOrId Job or job's id in queue
 *
 * @returns Job full info
 */
export async function getJob<D = {}, R = {}>(
  queueOrName: Queue | string,
  jobOrId: Job<D, R> | string,
): Promise<Job<D, R>> {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  const jobId = typeof jobOrId === 'string' ? jobOrId : jobOrId.id;

  const {
    content,
  } = await client.fetch<ApiResponse<RawJob<D, R>>>(`/queues/${queueName}/jobs/${jobId}`);

  return transformJob(content);
}
assignPermission(getJob, 'GET /queues/:name/jobs/:jobId', true);

/**
 * Retry job that failed
 *
 * @param queueOrName Queue or queue's name
 * @param jobOrId Job or job's id in queue
 *
 * @returns queue info
 */
export async function retryJob<D = {}, R = {}>(
  queueOrName: Queue | string,
  jobOrId: Job<D, R> | string,
): Promise<Job<D, R>> {
  const queueName = typeof queueOrName === 'string' ? queueOrName : queueOrName.name;
  const jobId = typeof jobOrId === 'string' || typeof jobOrId === 'number' ? jobOrId : jobOrId.id;

  const { content } = await client.fetch<ApiResponse<RawJob<D, R>>>(
    `/queues/${queueName}/jobs/${jobId}`,
    { method: 'POST', body: {} },
  );

  return transformJob(content);
}
assignPermission(retryJob, 'POST /queues/:name/jobs/:jobId', true);
