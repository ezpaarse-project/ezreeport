import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import initRPCServer from './server';

const logger = appLogger.child({ scope: 'rpc' });

export default async function initRPC(
  connection: rabbitmq.ChannelModel
): Promise<void> {
  const channel = await connection.createChannel();
  logger.debug('Channel created');

  initRPCServer(channel);
}
