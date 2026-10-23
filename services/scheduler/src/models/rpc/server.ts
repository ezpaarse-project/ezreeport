import { RPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { forceCron, getAllCrons, startCron, stopCron } from '~/models/crons';

const logger = appLogger.child({ scope: 'rpc.server' });

const router: RPCServerRouter = {
  forceCron,
  getAllCrons,
  startCron,
  stopCron,
};

// oxlint-disable-next-line no-underscore-dangle
let _cronServer: RPCServer;

// oxlint-disable-next-line import/no-default-export
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
