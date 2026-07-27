import type { Writable } from 'node:stream';

import { RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

// Let client: RPCClient | undefined;
let streamClient: RPCStreamClient | undefined;

export function initFilesClient(channel: rabbitmq.Channel): void {
  // SchedulerClient will be called while begin unaware of
  // Rabbitmq connection, so we need to store the channel
  // Here
  streamClient = new RPCStreamClient(
    channel,
    'ezreeport.rpc:files:stream',
    appLogger
  );
}

export function createReportWriteStream(
  filename: string,
  taskId: string,
  destroyAt: Date
): Promise<Writable> {
  if (!streamClient) {
    throw new Error('RPC client not initialized');
  }

  return streamClient.requestWriteStream(
    'reports',
    filename,
    taskId,
    destroyAt.toISOString()
  );
}
