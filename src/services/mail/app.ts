import http from 'node:http';

import * as checks from '~/models/healthchecks';

import { appLogger } from '~/lib/logger';

const server = http.createServer((req, res) => {
  Promise.all(
    Array.from(checks.services).map((s) => checks.ping(s)),
  ).then(() => {
    res.writeHead(200);
    res.end('OK');
  }).catch((err) => {
    res.writeHead(500);
    res.end(`ERROR: ${err}`);
  });
});

server.listen(8080, 'localhost', () => {
  appLogger.info('Server running on http://localhost:3000');
});
