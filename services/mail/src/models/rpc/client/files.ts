// import { setupRPCClient, type RPCClient } from '@ezreeport/rpc/client';
import { setupRPCStreamClient, type RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

let streamClient: RPCStreamClient | undefined;

export async function initFilesClient(channel: rabbitmq.Channel) {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  streamClient = setupRPCStreamClient(channel, 'ezreeport.rpc:files:stream', appLogger);
}

export function createReportReadStream(filename: string, taskId: string) {
  if (!streamClient) {
    throw new Error('RPC client not initialized');
  }

  return streamClient.requestReadStream('reports', filename, taskId);
}
