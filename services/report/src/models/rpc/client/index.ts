import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { initSchedulerClient } from './scheduler';

const logger = appLogger.child({ scope: 'rpc.client' });

export default async function initRPCClients(channel: rabbitmq.Channel) {
  const start = process.uptime();

  // Setup API Client
  await initSchedulerClient(channel);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
