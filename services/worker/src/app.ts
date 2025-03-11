import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import initQueue from '~/models/queues';
import { initRenderEngine } from '~/models/render';
import { initHttp } from './lib/http-requests';

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  await initQueue();

  await initRenderEngine();
  initHttp();

  appLogger.info({
    scope: 'init',
    readyDuration: process.uptime(),
    readyDurationUnit: 's',
    msg: 'Service ready',
  });
};
start();
