import config from '~/lib/config';
import startHTTPServer from '~/lib/http';
import { appLogger } from '~/lib/logger';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initCrons } from '~/models/crons';
import { abortDanglingGenerations } from '~/models/generations';
import { initHeartbeat, getMissingMandatoryServices } from '~/models/heartbeat';
import initQueues from '~/models/queues';
import initRPC from '~/models/rpc';

import { upsertDefaultTemplate } from './models/templates';

async function init(): Promise<void> {
  // Add default template if not already present
  try {
    const { id } = await upsertDefaultTemplate();
    appLogger.info({
      scope: 'init',
      defaultTemplateId: id,
      msg: 'Default template ready',
    });
  } catch (error) {
    appLogger.error({
      scope: 'init',
      err: error,
      message: "Couldn't upsert default template",
    });
  }

  // Abort dangling generations. If they were still active, events will mark them as active again
  try {
    const abortedCount = await abortDanglingGenerations();
    appLogger.info({
      scope: 'init',
      msg: 'Dangling generations aborted',
      abortedCount,
    });
  } catch (error) {
    appLogger.error({
      scope: 'init',
      err: error,
      message: "Couldn't abort dangling generations",
    });
  }
}

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
    await init();

    // Initialize other services (if fails, service is not ready)
    await useRabbitMQ(async (connection) => {
      await initRPC(connection);
      await initQueues(connection);
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

void start();
