import http from 'node:http';

import healthChecks from '~/models/healthchecks';

import { appLogger } from '~/lib/logger';

const server = http.createServer((req, res) => {
  switch (req.url) {
    // Liveness probe, check if the server is up
    case '/liveness':
    case '/liveness/':
      res.writeHead(204).end();
      break;

    // Readiness probe, check if the server is ready
    case '/readiness':
    case '/readiness/':
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
      break;

    // Route not found
    default:
      res.writeHead(404).end();
      break;
  }
});

const PORT = 8080;

server.listen(PORT, () => {
  appLogger.info({
    scope: 'http',
    address: `http://0.0.0.0:${PORT}`,
    startupDuration: process.uptime(),
    startupDurationUnit: 's',
    msg: 'Service listening',
  });
});
