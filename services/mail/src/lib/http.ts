import http from 'node:http';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

type Route = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => void;

const { port } = config;
const logger = appLogger.child({ scope: 'http' });

let server: http.Server | undefined;

export default function startHTTPServer(routes: Record<string, Route>) {
  const start = process.uptime();

  return new Promise<http.Server>((resolve) => {
    server = http.createServer((req, res) => {
      const route = routes[req.url] ?? routes[`${req.url}/`];
      if (route) {
        route(req, res);
      } else {
        res.writeHead(404).end();
      }
    });

    server.listen(port, () => {
      logger.info({
        address: `http://0.0.0.0:${port}`,
        startupDuration: process.uptime() - start,
        startupDurationUnit: 's',
        msg: 'Service listening',
      });

      resolve(server);
    });
  });
}

process.on('SIGTERM', () => {
  if (!server) {
    return;
  }

  server.close((err) => {
    if (err) {
      logger.error({ msg: 'Failed to close service', err });
      return;
    }

    logger.debug('Service closed');
  });
});
