import { RPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { getAllCrons, stopCron, startCron, forceCron } from '~/models/crons';

const logger = appLogger.child({ scope: 'rpc.server' });

const router: RPCServerRouter = {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
};

let _cronServer: RPCServer;

export default function initRPCServer(channel: rabbitmq.Channel): void {
  const start = process.uptime();

  _cronServer = new RPCServer(
    channel,
    'ezreeport.rpc:crons',
    appLogger,
    router
  );

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
