import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import initQueues from '~/models/queues';
import { initSMTP } from '~/models/mail';
import healthChecks from '~/models/healthchecks';
import startHTTPServer from './lib/http';

const start = async () => {
  appLogger.info({
    scope: 'node',
    env: process.env.NODE_ENV,
    logLevel: config.log.level,
    logDir: config.log.dir,
    msg: 'Service starting',
  });

  await initQueues();
  await initSMTP();

  await startHTTPServer({
    '/liveness': (req, res) => { res.writeHead(204).end(); },
    '/readiness': (req, res) => {
      healthChecks()
        .then(() => {
          res.writeHead(204).end();
        })
        .catch((err) => {
          appLogger.error({
            scope: 'ping',
            err,
            msg: 'Error when getting services',
          });
          res.writeHead(503).end(JSON.stringify(err));
        });
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
