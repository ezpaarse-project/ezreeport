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
          appLogger.error(`[health] ${err}`);
          res.writeHead(503).end(JSON.stringify(err));
        });
      break;

    // Route not found
    default:
      res.writeHead(404).end();
      break;
  }
});

server.listen(8080, 'localhost', () => {
  appLogger.info('Server running on http://localhost:8080');
});
