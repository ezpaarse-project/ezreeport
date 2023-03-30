import { parseISO } from 'date-fns';
import type { ResponseType } from 'axios';
import { Stream } from 'stream';
import axios, { axiosWithErrorFormatter } from '../lib/axios';
import createEventfulPromise from '../lib/promises';
import {
  parsePeriod,
  setTimeoutAsync,
  type Period,
  type RawPeriod
} from '../lib/utils';
import { getJob, type FullJob, type Job } from './queues';
import type { RawFullTask } from './tasks';

interface RawReportResultDetail {
  createdAt: string, // Date
  destroyAt: string, // Date
  took: number,
  taskId: string,
  files: {
    detail: string,
    report?: string,
    debug?: string,
  },
  sendingTo?: string[],
  period?: RawPeriod, // Period
  runAs?: string,
  stats?: object,
  error?: {
    message: string,
    stack: string[]
  },
  meta?: unknown
}

export interface ReportResultDetail extends Omit<RawReportResultDetail, 'createdAt' | 'destroyAt' | 'period'> {
  createdAt: Date,
  destroyAt: Date,
  period?: Period,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param detail Raw result detail
 *
 * @returns Parsed result detail
 */
const parseReportResultDetail = (detail: RawReportResultDetail): ReportResultDetail => ({
  ...detail,
  createdAt: parseISO(detail.createdAt),
  destroyAt: parseISO(detail.destroyAt),
  period: detail.period ? parsePeriod(detail.period) : undefined,
});

interface RawReportResult {
  success: boolean,
  detail: RawReportResultDetail // ReportResultDetail
}

export interface ReportResult extends Omit<RawReportResult, 'detail'> {
  detail: ReportResultDetail
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param result Raw result
 *
 * @returns Parsed result
 */
const parseReportResult = (result: RawReportResult): ReportResult => ({
  ...result,
  detail: parseReportResultDetail(result.detail),
});

interface RawReportData {
  task: RawFullTask, // Task
  origin: string,
  writeHistory?: boolean,
  customPeriod?: RawPeriod, // Period
  debug?: boolean
}

type ReportJob = Job<RawReportData>;
type FullReportJob = FullJob<RawReportData, RawReportResult>;

/**
 * Start generation of a report
 *
 * Needs `namespaces[namespaceId].tasks-post-task-run` permission
 *
 * @param taskId Id of the task
 * @param params Other params for overriding default
 * @param namespaces
 *
 * @returns Job info to track progress
 */
export const startGeneration = (
  taskId: RawFullTask['id'],
  params?: {
    /**
     * Override targets of task. Also enable first level of debugging
     * (disable generation history)
     */
    testEmails?: string[],
    /**
     * Override period, must match task's recurrence
     */
    period?: Period,
  },
  namespaces?: string[],
) => axios.$post<ReportJob>(
  `/tasks/${taskId}/run`,
  null,
  {
    params: {
      test_emails: params?.testEmails,
      period_start: params?.period?.start,
      period_end: params?.period?.end,
      namespaces,
    },
  },
);

export type GenerationStartedEvent = { id: string | number, queue: string };
export type GenerationProgressEvent = { progress: number, status: FullReportJob['status'] };

/**
 * Start generation of a report and track progress
 *
 * Needs `namespaces[namespaceId].tasks-post-task-run`
 * & `namespaces[namespaceId].queues-get-queue-jobs-jobId` permissions
 *
 * @param taskId Id of the task
 * @param params Other params for overriding default
 * @param namespaces
 *
 * @fires #started When generation started. See `GenerationStartedEvent`.
 * @fires #progress When generation progress. See `GenerationProgressEvent`. Job's progress is
 * between 0 and 1
 *
 * @throws If job's fails. **Not if generation fails !**
 *
 * @returns When generation ends, with detail
 */
export const startAndListenGeneration = (
  ...p: Parameters<typeof startGeneration>
) => createEventfulPromise(
  async (events) => {
    const { content: { id, queue } } = await startGeneration(...p);
    events.emit('started', { id, queue });

    // Pulling updates
    // TODO[feat]: WS ?
    let last: {
      progress: number,
      status: FullReportJob['status']
      result: FullReportJob['result']
    };
    do {
      const {
        content:
        {
          progress,
          status,
          result,
        },
        // FIXME: What if param order changes ?
        // eslint-disable-next-line no-await-in-loop
      } = await getJob<RawReportData, RawReportResult>(queue, id, p[2]);
      last = { progress, status, result };
      events.emit('progress', { progress, status });

      let sleepDuration = 1000;
      if (last.status === 'active') {
        sleepDuration = 250;
      }
      // eslint-disable-next-line no-await-in-loop
      await setTimeoutAsync(sleepDuration);
    } while (
      (['completed', 'failed', 'stuck']).includes(last.status as string) === false
    );

    if (!last.result) {
      throw new Error('Generation failed with weird error');
    }
    return parseReportResult(last.result);
  },
);

interface ResponseTypeMap {
  arraybuffer: ArrayBuffer
  blob: Blob
  json: object
  text: string
  stream: Stream
}
type GetJobParams = Parameters<typeof getJob>;

/**
 * Get report's related file
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename` permission
 *
 * @param pathName Path to the file
 * @param namespaces
 * @param responseType Wanted response type
 *
 * @returns The file's content
 */
const getFile = async <Result>(
  pathName: string,
  namespaces?: string[],
  responseType?: ResponseType,
) => (
  await axiosWithErrorFormatter<Result, 'get'>(
    'get',
    `/reports/${pathName}`,
    {
      responseType,
      params: { namespaces },
    },
  )
).data;

/**
 * Get report main file (the result) by giving the report's name
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename` permission
 *
 * @param name Name of the report
 * @param ext The extension of the result (renderer dependent)
 * @param namespaces
 * @param responseType Wanted response type
 *
 * @returns The report's content
 */
export const getReportFileByName = <Result extends keyof ResponseTypeMap = 'text'>(
  name: string,
  namespaces?: string[],
  responseType?: Result,
  ext = 'pdf',
) => getFile<ResponseTypeMap[Result]>(`${name}.rep.${ext}`, namespaces, responseType);

/**
 * Get report main file (the result) by giving job's info
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename`
 * & `namespaces[namespaceId].queues-get-queue-jobs-jobId ` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param namespaces
 * @param responseType Wanted response type
 *
 * @returns The report's content
 */
export const getReportFileByJob = async <Result extends keyof ResponseTypeMap = 'text'>(
  queueName: GetJobParams[0],
  jobId: GetJobParams[1],
  namespaces?: GetJobParams[2],
  responseType?: Result,
) => {
  const { content: { result } } = await getJob<RawReportData, RawReportResult>(
    queueName,
    jobId,
    namespaces,
  );
  if (!result) {
    throw new Error('Job have no result');
  }
  return getFile<ResponseTypeMap[Result]>(result.detail?.files.report ?? '', namespaces, responseType);
};

/**
 * Get report detail by giving the report's name
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename` permission
 *
 * @param name Name of the report
 * @param namespaces
 * @param responseType Wanted response type. **If provided with anything but `json` you will have to
 * cast in your type to avoid auto-completion issues.**
 *
 * @returns The detail's content
 */
export const getReportDetailByName = async (
  name: string,
  namespaces?: string[],
  responseType?: keyof ResponseTypeMap,
) => {
  const res = await getFile<RawReportResult>(`${name}.det.json`, namespaces, responseType);
  if (!responseType || responseType === 'json') {
    return parseReportResult(res);
  }
  // Allowing user to ask for other response type (and then cast in wanted type)
  // while not breaking auto-completion
  return res as unknown as ReportResult;
};

/**
 * Get report detail by giving job's info
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename`
 * & `namespaces[namespaceId].queues-get-queue-jobs-jobId` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param namespaces
 * @param responseType Wanted response type. **If provided with anything but `json` you will have to
 * cast in your type to avoid auto-completion issues.**
 *
 * @returns The detail's content
 */
export const getReportDetailByJob = async (
  queueName: GetJobParams[0],
  jobId: GetJobParams[1],
  namespaces?: GetJobParams[2],
  responseType?: keyof ResponseTypeMap,
) => {
  const { content: { result } } = await getJob<RawReportData, RawReportResult>(
    queueName,
    jobId,
    namespaces,
  );
  if (!result) {
    throw new Error('Job have no result');
  }
  const res = await getFile<RawReportResult>(result.detail?.files.detail ?? '', namespaces, responseType);
  if (!responseType || responseType === 'json') {
    return parseReportResult(res);
  }
  // Allowing user to ask for other response type (and then use `as`)
  // while not breaking auto-completion
  return res as unknown as ReportResult;
};

/**
 * Get report debug file by giving the report's name
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename` permission
 *
 * @param name Name of the report
 * @param namespaces
 * @param responseType Wanted response type
 *
 * @returns The debug's content
 */
export const getReportDebugByName = <Result extends keyof ResponseTypeMap = 'json'>(
  name: string,
  namespaces?: string[],
  responseType?: Result,
) => getFile<ResponseTypeMap[Result]>(`${name}.deb.json`, namespaces, responseType);

/**
 * Get report debug file by giving job's info
 *
 * Needs `namespaces[namespaceId].reports-get-year-yearMonth-filename`
 * & `namespaces[namespaceId].queues-get-queue-jobs-jobId ` permission
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param namespaces
 * @param responseType Wanted response type
 *
 * @returns The debug's content
 */
export const getReportDebugByJob = async <Result extends keyof ResponseTypeMap = 'json'>(
  queueName: GetJobParams[0],
  jobId: GetJobParams[1],
  namespaces?: GetJobParams[2],
  responseType?: Result,
) => {
  const { content: { result } } = await getJob<RawReportData, RawReportResult>(
    queueName,
    jobId,
    namespaces,
  );
  if (!result) {
    throw new Error('Job have no result');
  }
  return getFile<ResponseTypeMap[Result]>(result.detail?.files.debug ?? '', namespaces, responseType);
};
