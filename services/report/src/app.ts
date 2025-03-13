import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import startHTTPServer from '~/lib/http';

import initQueues from '~/models/queues';
import initRPCServer from '~/models/rpc/server';
import initRPCClients from '~/models/rpc/client';

import routes from '~/routes';

import { initTemplates } from './init';

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  try {
    await startHTTPServer(routes);

    await initTemplates();
    await initQueues();
    await initRPCServer();
    await initRPCClients();

    appLogger.info({
      scope: 'init',
      readyDuration: process.uptime(),
      readyDurationUnit: 's',
      msg: 'Service ready',
    });
  } catch (err) {
    appLogger.error(err);
    process.exit(1);
  }
};
start();
