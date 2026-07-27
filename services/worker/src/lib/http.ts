import type { Server } from 'node:http';

import { type Route, setupHTTPServer } from '@ezreeport/simple-http';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { port } = config;
const logger = appLogger.child({ scope: 'http' });

// oxlint-disable-next-line import/no-default-export
export default function initHTTPServer(
  routes: Record<string, Route>
): Promise<Server> {
  return setupHTTPServer(port, logger, routes);
}
