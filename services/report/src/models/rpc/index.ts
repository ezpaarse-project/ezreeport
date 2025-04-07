import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import initRPCClients from './client';

const logger = appLogger.child({ scope: 'rpc' });

export default async function initRPC(connection: rabbitmq.ChannelModel) {
  const channel = await connection.createChannel();
  logger.debug('Channel created');

  await initRPCClients(channel);
}
