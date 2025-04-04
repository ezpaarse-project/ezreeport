import { setupRPCServer, type RPCServerRouter } from '@ezreeport/rpc/server';

import type rabbitmq from '~/lib/rabbitmq';
import { appLogger } from '~/lib/logger';

import { getAllTasks } from '~/models/tasks';
import { getAllTemplates } from '~/models/templates';
import { getAllNamespaces } from '~/models/namespaces';

const logger = appLogger.child({ scope: 'rpc.server' });

const router: RPCServerRouter = {
  getAllTasks,
  getAllTemplates,
  getAllNamespaces,
};

export default async function initRPCServer(channel: rabbitmq.Channel) {
  const start = process.uptime();

  await setupRPCServer(channel, 'ezreeport.rpc:api', router, appLogger);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
