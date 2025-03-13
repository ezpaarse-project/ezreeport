import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import startHTTPServer from '~/lib/http';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initCrons } from '~/models/crons';
import initRPC from '~/models/rpc';
import initQueues from '~/models/queues';
import { initHeartbeat } from '~/models/heartbeat';

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  await useRabbitMQ(async (connection) => {
    await initRPC(connection);
    await initQueues(connection);
    await initHeartbeat(connection);
  });

  await initCrons();

  await startHTTPServer({
    '/liveness': (req, res) => {
      res.writeHead(204).end();
    },
    '/readiness': (req, res) => {
      res.writeHead(204).end();
    },
  });

  appLogger.info({
    scope: 'init',
    readyDuration: process.uptime(),
    readyDurationUnit: 's',
    msg: 'Service ready',
  });
};
start();
