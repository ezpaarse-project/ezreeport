import type { Writable } from 'node:stream';

import { RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

// let client: RPCClient | undefined;
let streamClient: RPCStreamClient | undefined;

export function initFilesClient(channel: rabbitmq.Channel): void {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
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
