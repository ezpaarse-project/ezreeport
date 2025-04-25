import { setupRPCStreamClient, type RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

// let client: RPCClient | undefined;
let streamClient: RPCStreamClient | undefined;

export async function initFilesClient(channel: rabbitmq.Channel) {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  streamClient = setupRPCStreamClient(channel, 'ezreeport.rpc:files:stream', appLogger);
}

export function createReportWriteStream(filename: string, taskId: string, destroyAt: Date) {
  if (!streamClient) {
    throw new Error('RPC client not initialized');
  }

  return streamClient.requestWriteStream('reports', filename, taskId, destroyAt.toISOString());
}
