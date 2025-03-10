import { appLogger } from '~/lib/logger';

import { initCrons } from '~/models/crons';
import { initRPCClient } from '~/models/rpc/client';

const start = async () => {
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
