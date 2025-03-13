import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { initHttpRequests } from '~/lib/http-requests';
import { elasticPing } from '~/lib/elastic';

import initQueues from '~/models/queues';
import { initRenderEngine } from '~/models/render';

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  await initQueues();

  await elasticPing();
  initHttpRequests();
  await initRenderEngine();

  appLogger.info({
    scope: 'init',
    readyDuration: process.uptime(),
    readyDurationUnit: 's',
    msg: 'Service ready',
  });
};
start();
