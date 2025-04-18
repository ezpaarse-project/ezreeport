import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import startHTTPServer from '~/lib/http';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initHeartbeat, getMissingMandatoryServices } from '~/models/heartbeat';
import initRPC from '~/models/rpc';

const start = async () => {
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
        if (missing.length) {
          res.writeHead(503).end();
        } else {
          res.writeHead(204).end();
        }
      },
    });

    // Initialize other services (if fails, service is not ready)
    await useRabbitMQ(async (connection) => {
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
    process.exit(1);
  }
};
start();
