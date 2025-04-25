import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { initCronsClient } from './crons';

const logger = appLogger.child({ scope: 'rpc.client' });

export default async function initRPCClients(channel: rabbitmq.Channel) {
  const start = process.uptime();

  // Setup API Client
  await initCronsClient(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
