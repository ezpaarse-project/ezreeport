import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import initRPCClients from './client';

const logger = appLogger.child({ scope: 'rpc' });

// oxlint-disable-next-line import/no-default-export
export default async function initRPC(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const channel = await connection.createChannel();
  logger.debug('Channel created');

  initRPCClients(channel);
}
