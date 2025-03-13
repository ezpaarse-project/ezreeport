import { appLogger } from '~/lib/logger';

import { getSchedulerClient } from './scheduler';

const logger = appLogger.child({ scope: 'rpc.client' });

export default async function initRPCClients() {
  const start = process.uptime();

  // Setup API Client
  await getSchedulerClient();

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
