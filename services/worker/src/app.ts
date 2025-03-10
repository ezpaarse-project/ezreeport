import { appLogger } from '~/lib/logger';

import initQueue from '~/models/queues';
import { initRenderEngine } from '~/models/render';
import { initHttp } from './lib/http-requests';

const start = async () => {
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
