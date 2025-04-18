// import { setupRPCClient, type RPCClient } from '@ezreeport/rpc/client';
import { setupRPCStreamClient, type RPCStreamClient } from '@ezreeport/rpc/streams/client';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

// let client: RPCClient | undefined;
let streamClient: RPCStreamClient | undefined;

export async function initFilesClient(channel: rabbitmq.Channel) {
  // schedulerClient will be called while begin unaware of
  // rabbitmq connection, so we need to store the channel
  // here
  // client = setupRPCClient(channel, 'ezreeport.rpc:files', appLogger);
  streamClient = setupRPCStreamClient(channel, 'ezreeport.rpc:files:stream', appLogger, { compression: false });
}

export function createReportReadStream(filename: string) {
  if (!streamClient) {
    throw new Error('RPC client not initialized');
  }

  return streamClient.requestReadStream('reports', filename);
}
