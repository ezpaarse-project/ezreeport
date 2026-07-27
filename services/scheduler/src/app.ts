import config from '~/lib/config';
import startHTTPServer from '~/lib/http';
import { appLogger } from '~/lib/logger';
import { useRabbitMQ } from '~/lib/rabbitmq';

import { initCrons } from '~/models/crons';
import { abortDanglingGenerations } from '~/models/generations';
import { getMissingMandatoryServices, initHeartbeat } from '~/models/heartbeat';
import initQueues from '~/models/queues';
import initRPC from '~/models/rpc';

import { upsertDefaultTemplate } from './models/templates';

async function init(): Promise<void> {
  // Add default template if not already present
  try {
    const { id } = await upsertDefaultTemplate();
    appLogger.info({
      defaultTemplateId: id,
      msg: 'Default template ready',
      scope: 'init',
    });
  } catch (error) {
    appLogger.error({
      err: error,
      message: "Couldn't upsert default template",
      scope: 'init',
    });
  }

  // Abort dangling generations. If they were still active, events will mark them as active again
  try {
    const abortedCount = await abortDanglingGenerations();
    appLogger.info({
      abortedCount,
      msg: 'Dangling generations aborted',
      scope: 'init',
    });
  } catch (error) {
    appLogger.error({
      err: error,
      message: "Couldn't abort dangling generations",
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
