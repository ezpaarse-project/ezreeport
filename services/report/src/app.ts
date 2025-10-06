import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { startHTTPServer } from '~/lib/http';
import { useRabbitMQ } from '~/lib/rabbitmq';

import initQueues from '~/models/queues';
import initRPC from '~/models/rpc';
import { initHeartbeat } from '~/models/heartbeat';

import routes from '~/routes';

import { initTemplates } from './init';

async function start(): Promise<void> {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  try {
    // Initialize core services (if fails, service is unhealthy)
    await startHTTPServer(routes);
    await initTemplates();

    // Initialize other services (if fails, service is degraded)
    await useRabbitMQ(async (connection) => {
      await initQueues(connection);
      await initRPC(connection);
      await initHeartbeat(connection);
    });

    appLogger.info({
      scope: 'init',
      readyDuration: process.uptime(),
      readyDurationUnit: 's',
      msg: 'Service ready',
    });
  } catch (err) {
    appLogger.error(err);
    throw err instanceof Error ? err : new Error(`${err}`);
  }
}
start();
