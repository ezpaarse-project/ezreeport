import config from '~/lib/config';
import { startHTTPServer } from '~/lib/http';
import { appLogger } from '~/lib/logger';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initHeartbeat } from '~/models/heartbeat';
import initQueues from '~/models/queues';
import initRPC from '~/models/rpc';
import { getDefaultTemplate } from '~/models/templates';

import routes from '~/routes';

async function init(): Promise<void> {
  try {
    const { id } = await getDefaultTemplate();
    config.defaultTemplate.id = id;
    appLogger.info({
      defaultTemplateId: id,
      msg: 'Default template ready',
      scope: 'init',
    });
  } catch (error) {
    appLogger.error({
      err: error,
      message: "Couldn't get default template",
      scope: 'init',
    });
  }
}

async function start(): Promise<void> {
  appLogger.info({
    env: process.env.NODE_ENV,
    logDir: config.log.dir,
    logLevel: config.log.level,
    msg: 'Service starting',
    scope: 'node',
  });

  try {
    // Initialize core services (if fails, service is unhealthy)
    await startHTTPServer(routes);
    await init();

    // Initialize other services (if fails, service is degraded)
    await useRabbitMQ(async (connection) => {
      await initQueues(connection);
      await initRPC(connection);
      await initHeartbeat(connection);
    });

    appLogger.info({
      msg: 'Service ready',
      readyDuration: process.uptime(),
      readyDurationUnit: 's',
      scope: 'init',
    });
  } catch (error) {
    appLogger.error(error);
    throw error instanceof Error ? error : new Error(`${error}`);
  }
}

void start();
