import type { Readable } from 'node:stream';

// import { setupRPCClient, type RPCClient } from '@ezreeport/rpc/client';
import { RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

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

export function createReportReadStream(
  filename: string,
  taskId: string
): Promise<Readable> {
  if (!streamClient) {
    throw new Error('RPC client not initialized');
  }

  return streamClient.requestReadStream('reports', filename, taskId);
}
