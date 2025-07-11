import http from 'node:http';

import type { Logger } from '@ezreeport/logger';

export type Route = (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage>
) => void;

let server: http.Server | undefined;

export function setupHTTPServer(
  port: number,
  logger: Logger,
  routes: Record<string, Route>
): Promise<http.Server> {
  const start = process.uptime();

  // oxlint-disable-next-line promise/avoid-new
  return new Promise<http.Server>((resolve) => {
    server = http.createServer((req, res) => {
      const route = routes[req.url || ''] ?? routes[`${req.url}/`];
      if (route) {
        route(req, res);
      } else {
        res.writeHead(404).end();
      }
    });

    server.listen(port, () => {
      logger.info({
        address: `http://0.0.0.0:${port}`,
        initDuration: process.uptime() - start,
        initDurationUnit: 's',
        msg: 'Service listening',
      });

      process.on('SIGTERM', () => {
        if (!server) {
          return;
        }

        // oxlint-disable-next-line promise/prefer-await-to-callbacks
        server.close((err) => {
          if (err) {
            logger.error({ msg: 'Failed to close service', err });
            return;
          }

          logger.debug('Service closed');
        });
      });

      resolve(server!);
    });
  });
}
