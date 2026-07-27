import { formatISO, parseISO } from 'date-fns';

import type { ApiResponse } from '~/lib/api';
import { client } from '~/lib/fetch';
import { transformCreated } from '~/lib/transform';

import type { Task } from '~/modules/tasks/types';
import { assignPermission } from '~/helpers/permissions/decorator';

import type {
  RawReportDetails,
  RawReportPeriod,
  RawReportResult,
  ReportDetails,
  ReportFiles,
  ReportPeriod,
  ReportResult,
} from './types';

type ReportMap = Record<string, ReportFiles>;

export const transformPeriod = (period: RawReportPeriod): ReportPeriod => ({
  end: parseISO(period.end),
  start: parseISO(period.start),
});

export const transformReportDetails = (
  detail: RawReportDetails
): ReportDetails => ({
  ...transformCreated(detail),
  destroyAt: parseISO(detail.destroyAt),
  period: detail.period ? transformPeriod(detail.period) : undefined,
});

export const transformReportResult = (
  report: RawReportResult
): ReportResult => ({
  ...report,
  detail: transformReportDetails(report.detail),
});

/**
 * Get all available reports
 *
 * @returns Object with keys being task IDs, values being report IDs
 */
export async function getAllReports(): Promise<Record<string, ReportMap>> {
  const { content } =
    await client.fetch<ApiResponse<Record<string, ReportMap>>>('/reports');

  return content;
}
assignPermission(getAllReports, 'GET /reports');

/**
 * Get all available reports of a task
 *
 * @param taskOrId Task or Task's id
 *
 * @returns Object with keys being report IDs, values being files
 */
export async function getReportsOfTask(
  taskOrId: Omit<Task, 'template'> | string
): Promise<ReportMap> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  const { content } = await client.fetch<ApiResponse<ReportMap>>(
    `/reports/${id}`
  );

  return content;
}
assignPermission(getReportsOfTask, 'GET /reports/:taskId', true);

/**
 * Get a report file as a blob
 *
 * @param taskOrId Task or Task's id
 * @param path Path to the file
 *
 * @returns The blob
 */
export function getFileAsBlob(
  taskOrId: Omit<Task, 'template'> | string,
  path: string
): Promise<Blob> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  return client.fetch(`/reports/${id}/${path}`, {
    responseType: 'blob',
  });
}
assignPermission(
  getFileAsBlob,
  'GET /reports/:taskId/:yearMonth/:reportName.:type.:ext',
  true
);

/**
 * Get a report file as an array buffer
 *
 * @param taskOrId Task or Task's id
 * @param path Path to the file
 *
 * @returns The array buffer
 */
export function getFileAsArrayBuffer(
  taskOrId: Omit<Task, 'template'> | string,
  path: string
): Promise<ArrayBuffer> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  return client.fetch(`/reports/${id}/${path}`, {
    responseType: 'arrayBuffer',
  });
}
assignPermission(
  getFileAsArrayBuffer,
  'GET /reports/:taskId/:yearMonth/:reportName.:type.:ext',
  true
);

/**
 * Get a report file as a stream
 *
 * @param taskOrId Task or Task's id
 * @param path Path to the file
 *
 * @returns The stream
 */
export function getFileAsStream(
  taskOrId: Omit<Task, 'template'> | string,
  path: string
): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  return client.fetch(`/reports/${id}/${path}`, {
    responseType: 'stream',
  });
}
assignPermission(
  getFileAsStream,
  'GET /reports/:taskId/:yearMonth/:reportName.:type.:ext',
  true
);

/**
 * Get a report file as a text
 *
 * @param taskOrId Task or Task's id
 * @param path Path to the file
 *
 * @returns The text
 */
export function getFileAsText(
  taskOrId: Omit<Task, 'template'> | string,
  path: string
): Promise<string> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  return client.fetch(`/reports/${id}/${path}`, {
    responseType: 'text',
  });
}
assignPermission(
  getFileAsText,
  'GET /reports/:taskId/:yearMonth/:reportName.:type.:ext',
  true
);

/**
 * Get a report file as a JSON object
 * The file should end with `.det.json`
 *
 * @param taskOrId Task or Task's id
 * @param path Path to the file
 *
 * @returns The JSON object
 */
export async function getFileAsJson(
  taskOrId: Omit<Task, 'template'> | string,
  path: `${string}.det.json`
): Promise<ReportResult> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  const content = await client.fetch<RawReportResult>(`/reports/${id}/${path}`);
  return transformReportResult(content);
}
assignPermission(
  getFileAsJson,
  'GET /reports/:taskId/:yearMonth/:reportName.:type.:ext',
  true
);

/**
 * Start a report generation
 *
 * @param taskOrId Task or Task's id
 * @param targets Override targets, also enable first level of debugging
 * @param period Override period, must match task's recurrence
 *
 * @returns Data to get job, and so the progress of the generation
 */
export async function generateReportOfTask(
  taskOrId: Omit<Task, 'template'> | string,
  period?: { start: Date; end: Date },
  targets?: string[]
): Promise<{ id: string }> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  let periodDate;
  if (period) {
    periodDate = {
      end: formatISO(period.end, { representation: 'date' }),
      start: formatISO(period.start, { representation: 'date' }),
    };
  }

  const { content } = await client.fetch<ApiResponse<{ id: string }>>(
    `/reports/${id}`,
    {
      body: {
        period: periodDate,
        targets,
      },
      method: 'POST',
    }
  );

  return content;
}
assignPermission(generateReportOfTask, 'POST /reports/:taskId', true);
