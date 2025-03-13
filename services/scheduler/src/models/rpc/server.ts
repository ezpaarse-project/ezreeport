import { type RPCServerRouter, setupRPCServer } from '~common/lib/rpc';
import { appLogger } from '~/lib/logger';

import {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
} from '~/models/crons';

import getChannel from './channel';

const logger = appLogger.child({ scope: 'rpc.server' });

const router: RPCServerRouter = {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
};

export default async function initRPCServer() {
  const start = process.uptime();

  const channel = await getChannel();

  await setupRPCServer(channel, 'ezreeport.rpc:scheduler', router, appLogger);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
