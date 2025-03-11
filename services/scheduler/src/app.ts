import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import { initCrons } from '~/models/crons';
import { initRPCClient } from '~/models/rpc/client';

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  await initCrons();
  await initRPCClient();

  appLogger.info({
    scope: 'init',
    readyDuration: process.uptime(),
    readyDurationUnit: 's',
    msg: 'Service ready',
  });
};
start();
