import type { Readable } from 'node:stream';

import { RPCClient } from '@ezreeport/rpc/client';
import { RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import type {
  ReportFilesOfTaskType,
  ReportFilesType,
} from '~/models/reports/types';

let client: RPCClient | undefined;
let streamClient: RPCStreamClient | undefined;

export function initFilesClient(channel: rabbitmq.Channel): void {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  client = new RPCClient(channel, 'ezreeport.rpc:files', appLogger);
  streamClient = new RPCStreamClient(
    channel,
    'ezreeport.rpc:files:stream',
    appLogger
  );
}

export function createReportReadStream(
  filename: string,
  taskId: string
): Promise<Readable> {
  if (!streamClient) {
    throw new Error('RPC client not initialized');
  }

  return streamClient.requestReadStream('reports', filename, taskId);
}

export async function getAllReports(): Promise<
  Record<string, ReportFilesOfTaskType>
> {
  if (!client) {
    throw new Error('RPC client not initialized');
  }

  const data = await client.callAll('getAllReports');
  const reportsOfTasks = new Map<string, Map<string, ReportFilesType>>();

  for (const entry of data
    .filter((report) => !(report instanceof Error))
    .flat()) {
    const { task_id: taskId, filename } = entry as {
      task_id: string;
      filename: string;
    };

    const { groups } =
      /(?<reportId>.+?)(\.(?<type>det|deb|rep))?\.(?<ext>json|pdf)$/i.exec(
        filename
      ) ?? {};
    if (!groups) {
      continue;
    }

    const reports =
      reportsOfTasks.get(taskId) ?? new Map<string, ReportFilesType>();
    const report = reports.get(groups.reportId) ?? { detail: '' };
    if (groups.type === 'det') {
      report.detail = filename;
    }
    if (groups.type === 'deb') {
      report.debug = filename;
    }
    if (groups.type === 'rep') {
      report.report = filename;
    }

    reports.set(groups.reportId, report);
    reportsOfTasks.set(taskId, reports);
  }

  return Object.fromEntries(
    Array.from(reportsOfTasks).map(([taskId, reports]) => [
      taskId,
      Object.fromEntries(reports),
    ])
  );
}
