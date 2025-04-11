import { setupRPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
} from '~/models/crons';

const logger = appLogger.child({ scope: 'rpc.server' });

const router: RPCServerRouter = {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
};

export default async function initRPCServer(channel: rabbitmq.Channel) {
  const start = process.uptime();

  await setupRPCServer(channel, 'ezreeport.rpc:scheduler', router, appLogger);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
