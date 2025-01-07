import { parseISO } from 'date-fns';

import type { ApiRequestOptions } from '~/lib/api';
import createEventfulPromise, { type EventfulPromise } from '~/lib/promises';
import { setTimeoutAsync } from '~/lib/utils';

import { assignDependencies } from '~/helpers/permissions/decorator';

import { transformReportResult, generateReportOfTask, transformPeriod } from '~/modules/reports/methods';
import type { RawReportResult, ReportResult } from '~/modules/reports/types';
import { transformTask } from '~/modules/tasks/methods';
import type { RawTask, Task } from '~/modules/tasks/types';
import {
  type PaginatedJobs,
  getQueueJobs,
  getJob,
  retryJob,
} from '~/modules/queues/methods';
import type {
  RawGenerationData,
  GenerationData,
  RawMailData,
  MailData,
  RawMailError,
  MailError,
  JobStatus,
  Job,
} from '~/modules/queues/types';

const transformGenerationData = (data: RawGenerationData): GenerationData => ({
  ...data,
  task: transformTask(data.task as RawTask),
  period: data.period ? transformPeriod(data.period) : undefined,
});

const transformMailData = (data: RawMailData | RawMailError): MailData | MailError => ({
  ...data,
  date: parseISO(data.date),
});

const transformGenerationJob = <R = {}>(
  job: Job<RawGenerationData, R>,
): Job<GenerationData, R> => ({
    ...job,
    data: transformGenerationData(job.data),
  });

const transformMailJob = <R = {}>(
  job: Job<RawMailData | RawMailError, R>,
): Job<MailData | MailError, R> => ({
    ...job,
    data: transformMailData(job.data),
  });

export type GenerationJob = Job<GenerationData, { success: boolean }>;
export type GenerationJobWithResult = Job<GenerationData, ReportResult>;

export type MailJob = Job<MailData | MailError, {}>;

export const isErrorMailJob = (job: MailJob): job is Job<MailError, {}> => 'error' in job.data;
export const isDataMailJob = (job: MailJob): job is Job<MailData, {}> => !isErrorMailJob(job);

type PaginatedGenerationJobs = PaginatedJobs<GenerationData, { success: boolean }>;

/**
 * Get jobs of the generation queue
 *
 * @returns jobs in queue
 */
export async function getGenerationJobs(
  opts?: ApiRequestOptions,
): Promise<PaginatedGenerationJobs> {
  const { items, ...pagination } = await getQueueJobs<RawGenerationData, { success: boolean }>(
    'generation',
    opts,
  );

  return {
    items: items.map(transformGenerationJob),
    ...pagination,
  };
}
assignDependencies(getGenerationJobs, [getQueueJobs]);

export type PaginatedMailJobs = PaginatedJobs<MailData | MailError, {}>;

/**
 * Get jobs of the mail queue
 *
 * @returns jobs in queue
 */
export async function getMailJobs(opts?: ApiRequestOptions): Promise<PaginatedMailJobs> {
  const { items, ...pagination } = await getQueueJobs<RawMailData | RawMailError, {}>(
    'mail',
    opts,
  );

  return {
    items: items.map(transformMailJob),
    ...pagination,
  };
}
assignDependencies(getMailJobs, [getQueueJobs]);

/**
 * Get specific generation job
 *
 * @param queueOrName Queue or queue's name
 * @param jobOrId Job or job's id in queue
 *
 * @returns Job full info
 */
export async function getGenerationJob(
  jobOrId: Job<GenerationData> | string,
): Promise<GenerationJobWithResult> {
  const jobId = typeof jobOrId === 'string' ? jobOrId : jobOrId.id;
  const item = await getJob<RawGenerationData, RawReportResult>('generation', jobId);

  return {
    ...transformGenerationJob(item),
    result: item.result && transformReportResult(item.result),
  };
}
assignDependencies(getGenerationJob, [getJob]);

/**
 * Get specific mail job
 *
 * @param queueOrName Queue or queue's name
 * @param jobOrId Job or job's id in queue
 *
 * @returns Job full info
 */
export async function getMailJob(
  jobOrId: Job<MailData> | string,
): Promise<MailJob> {
  const jobId = typeof jobOrId === 'string' ? jobOrId : jobOrId.id;
  const item = await getJob<RawMailData, {}>('mail', jobId);

  return transformMailJob(item);
}
assignDependencies(getMailJob, [getJob]);

/**
 * Retry generation job that failed
 *
 * @param queueOrName Queue or queue's name
 * @param jobOrId Job or job's id in queue
 *
 * @returns queue info
 */
export async function retryGenerationJob(
  jobOrId: Job<GenerationData> | string,
): Promise<Job<GenerationData, RawReportResult>> {
  const jobId = typeof jobOrId === 'string' || typeof jobOrId === 'number' ? jobOrId : jobOrId.id;
  const item = await retryJob<RawGenerationData, RawReportResult>('generation', jobId);

  return transformGenerationJob(item);
}
assignDependencies(retryGenerationJob, [retryJob]);

/**
 * Retry mail job that failed
 *
 * @param queueOrName Queue or queue's name
 * @param jobOrId Job or job's id in queue
 *
 * @returns queue info
 */
export async function retryMailJob(
  jobOrId: Job<MailData | MailError> | string,
): Promise<MailJob> {
  const jobId = typeof jobOrId === 'string' || typeof jobOrId === 'number' ? jobOrId : jobOrId.id;
  const item = await retryJob<RawMailData | RawMailError, {}>('mail', jobId);

  return transformMailJob(item);
}
assignDependencies(retryMailJob, [retryJob]);

export type GenerationStartedEvent = { queue: string, jobId: string | number };

export type GenerationProgressEvent = { progress: number, status: JobStatus };

type GenerationEvents = {
  'started': [GenerationStartedEvent],
  'progress': [GenerationProgressEvent],
};

/**
 * Start generation of a report and track progress
 *
 * @param taskOrId Task or Task's id
 * @param targets Override targets, also enable first level of debugging
 * @param period Override period, must match task's recurrence
 *
 * @fires #started When generation started. See `GenerationStartedEvent`.
 * @fires #progress When generation progress. See `GenerationProgressEvent`. Job's progress is
 * between 0 and 1
 *
 * @throws If job's fails. **Not if generation fails !**
 *
 * @returns When the report is ready, returns the report result
 */
export function generateAndListenReportOfTask(
  taskOrId: Omit<Task, 'template'> | string,
  period?: { start: Date, end: Date },
  targets?: string[],
  polling?: { pending?: number, active?: number } | number,
): EventfulPromise<ReportResult, GenerationEvents> {
  const endStatuses = new Set(['completed', 'failed', 'stuck']);

  const sleepDurations = {
    pending: typeof polling === 'number' ? polling : polling?.pending ?? 1000,
    active: typeof polling === 'number' ? polling : polling?.active ?? 1000,
  };

  return createEventfulPromise<ReportResult, GenerationEvents>(
    async (events) => {
      const { queue, jobId } = await generateReportOfTask(taskOrId, period, targets);
      events.emit('started', { queue, jobId });

      let last: {
        progress: number,
        status: JobStatus,
        result: ReportResult | undefined,
      } | undefined;

      /* eslint-disable no-await-in-loop */
      while (!endStatuses.has(last?.status ?? '')) {
        const {
          progress,
          status,
          result,
        } = await getGenerationJob(jobId);

        last = { progress, status, result };
        events.emit('progress', { progress, status });

        let sleepDuration = sleepDurations.pending;
        if (last?.status === 'active') {
          sleepDuration = sleepDurations.active;
        }
        await setTimeoutAsync(sleepDuration);
      }
      /* eslint-enable no-await-in-loop */

      if (!last?.result) {
        throw new Error('Job failed');
      }
      return last.result;
    },
  );
}
assignDependencies(generateAndListenReportOfTask, [generateReportOfTask, getGenerationJob]);
