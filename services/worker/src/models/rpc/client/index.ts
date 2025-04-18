import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { initFilesClient } from './files';

const logger = appLogger.child({ scope: 'rpc.client' });

export default async function initRPCClients(channel: rabbitmq.Channel) {
  const start = process.uptime();

  // Setup files client
  await initFilesClient(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
