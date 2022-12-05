import axios from '../lib/axios';
import createEventfullPromise from '../lib/promises';
import { sleep } from '../lib/utils';
import { FullJob, getJob, Job } from './queues';

interface ReportResult {
  success: boolean,
  detail: {
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
    period?: {
      start: string, // Date
      end: string, // Date
    },
    runAs?: string,
    stats?: object,
    error?: {
      message: string,
      stack: string[]
    },
    meta?: unknown
  }
}

interface ReportData {
  task: any, // Task
  origin: string,
  writeHistory?: boolean,
  customPeriod?: { start: string, end: string },
  debug?: boolean
}

type ReportJob = Job<ReportData>;
type FullReportJob = FullJob<ReportData, ReportResult>;

/**
 * Start generation of a report
 *
 * Needs `perms.reports.create`
 *
 * @param taskId Id of the task
 * @param params Other params for overriding default
 * @param institution Force institution
 *
 * @returns Job info to track progress
 */
export const startGeneration = (
  taskId: string,
  params?: {
    testEmails?: string[],
    period?: { start: string, end: string },
  },
  institution?: string,
) => axios.$post<ReportJob>(
  `/tasks/${taskId}/run`,
  null,
  {
    params: {
      test_emails: params?.testEmails,
      period_start: params?.period?.start,
      period_end: params?.period?.end,
      institution,
    },
  },
);

/**
 * Start generation of a report and track progress
 *
 * Needs `perms.reports.create` & `perms.queues.jobs.read_one`
 *
 * @param taskId Id of the task
 * @param params Other params for overriding default
 * @param institution Force institution
 *
 * @fires #started When generation started. Contains job's id and queue.
 * @fires #progress When generation progress. Contains job's progress (>= 0 & <= 1) & status
 *
 * @throws If job's fails. **Not if generation fails !**
 *
 * @returns When generation ends, with detail
 */
export const listenGeneration = (
  ...p: Parameters<typeof startGeneration>
) => createEventfullPromise(
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
      } = await getJob<ReportData, ReportResult>(queue, id, p[2]);
      last = { progress, status, result };
      events.emit('progress', { progress, status });

      let sleepDuration = 1000;
      if (last.status === 'active') {
        sleepDuration = 250;
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(sleepDuration);
    } while (
      (['completed', 'failed', 'stuck']).includes(last.status as string) === false
    );

    if (!last.result) {
      throw new Error('Generation failed with weird error');
    }
    return last.result.detail;
  },
);

/**
 * Get report's related file
 *
 * @param pathName Path to the file
 * @param institution Force institution
 *
 * @returns The file's content
 */
const getFile = async <Result>(
  pathName: string,
  institution?: string,
) => (await axios.get<Result>(`/reports/${pathName}`, { params: { institution } })).data;

/**
 * Get report main file (the result) by giving the report's name
 *
 * @param name Name of the report
 * @param ext The extension of the result (renderer dependent)
 * @param institution Force institution
 *
 * @returns The report's content
 */
export const getReportFileByName = (
  name: string,
  institution?: string,
  ext = 'pdf',
) => getFile<string>(`${name}.rep.${ext}`, institution);

/**
 * Get report main file (the result) by giving job's info
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution
 *
 * @returns The report's content
 */
export const getReportFileByJob = async (
  ...p: Parameters<typeof getJob>
) => {
  const { content: { result } } = await getJob<ReportData, ReportResult>(...p);
  if (!result) {
    throw new Error('Job have no result');
  }
  // FIXME: What if param order changes ?
  return getFile<string>(result.detail?.files.report ?? '', p[2]);
};

/**
 * Get report detail by giving the report's name
 *
 * @param name Name of the report
 * @param institution Force institution
 *
 * @returns The detail's content
 */
export const getReportDetailByName = (
  name: string,
  institution?: string,
) => getFile<ReportResult>(`${name}.det.json`, institution);

/**
 * Get report detail by giving job's info
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution
 *
 * @returns The detail's content
 */
export const getReportDetailByJob = async (
  ...p: Parameters<typeof getJob>
) => {
  const { content: { result } } = await getJob<ReportData, ReportResult>(...p);
  if (!result) {
    throw new Error('Job have no result');
  }
  // FIXME: What if param order changes ?
  return getFile<ReportResult>(result.detail?.files.detail ?? '', p[2]);
};

/**
 * Get report debug file by giving the report's name
 *
 * @param name Name of the report
 * @param institution Force institution
 *
 * @returns The debug's content
 */
export const getReportDebugByName = (
  name: string,
  institution?: string,
) => getFile<object>(`${name}.deb.json`, institution);

/**
 * Get report debug file by giving job's info
 *
 * @param queueName Name of queue where job is
 * @param jobId Id of the job in queue
 * @param institution Force institution
 *
 * @returns The debug's content
 */
export const getReportDebugByJob = async (
  ...p: Parameters<typeof getJob>
) => {
  const { content: { result } } = await getJob<ReportData, ReportResult>(...p);
  if (!result) {
    throw new Error('Job have no result');
  }
  // FIXME: What if param order changes ?
  return getFile<object>(result.detail?.files.debug ?? '', p[2]);
};
