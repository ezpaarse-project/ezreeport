import config from '~/lib/config';
import startHTTPServer from '~/lib/http';
import { appLogger } from '~/lib/logger';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { getMissingMandatoryServices, initHeartbeat } from '~/models/heartbeat';
import { initSMTP } from '~/models/mail';
import initQueues from '~/models/queues';
import initRPC from '~/models/rpc';

async function start(): Promise<void> {
  appLogger.info({
    env: process.env.NODE_ENV,
    logDir: config.log.dir,
    logLevel: config.log.level,
    msg: 'Service starting',
    scope: 'node',
  });
  try {
    // Initialize health routes
    await startHTTPServer({
      '/liveness': (req, res) => {
        res.writeHead(204).end();
      },
      '/readiness': (req, res) => {
        const missing = getMissingMandatoryServices();
        if (missing.length > 0) {
          res.writeHead(503).end();
        } else {
          res.writeHead(204).end();
        }
      },
    });

    // Initialize core services (if fails, service is not alive)
    initSMTP();

    // Initialize other services (if fails, service is not ready)
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
start();
