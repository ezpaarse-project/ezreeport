import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import startHTTPServer from '~/lib/http';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initCrons } from '~/models/crons';
import initRPC from '~/models/rpc';
import initQueues from '~/models/queues';
import { initHeartbeat, getMissingMandatoryServices } from '~/models/heartbeat';
import { abortDanglingGenerations } from '~/models/generations';

async function start(): Promise<void> {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
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
    initCrons();

    // Initialize other services (if fails, service is not ready)
    await useRabbitMQ(async (connection) => {
      await initRPC(connection);
      await initQueues(connection);
      await initHeartbeat(connection);
    });

    // Abort dangling generations. If they were still active, events will mark them as active again
    await abortDanglingGenerations();
    appLogger.info({ msg: 'Dangling generations aborted' });

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
