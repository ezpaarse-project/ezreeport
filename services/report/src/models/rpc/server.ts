import { type RPCServerRouter, setupRPCServer } from '~common/lib/rpc';
import { appLogger } from '~/lib/logger';

import { getAllTasks } from '~/models/tasks';
import { getAllTemplates } from '~/models/templates';
import { getAllNamespaces } from '~/models/namespaces';

import getChannel from './channel';

const logger = appLogger.child({ scope: 'rpc.server' });

const router: RPCServerRouter = {
  getAllTasks,
  getAllTemplates,
  getAllNamespaces,
};

export default async function initRPCServer() {
  const start = process.uptime();

  const channel = await getChannel();

  await setupRPCServer(channel, 'ezreeport.rpc:api', router, appLogger);

  logger.info({
    initDuration: process.uptime() - start,
    initDurationUnit: 's',
    msg: 'Init completed',
  });
}
