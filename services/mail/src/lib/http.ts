import { setupHTTPServer, type Route } from '@ezreeport/simple-http';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

const { port } = config;
const logger = appLogger.child({ scope: 'http' });

export default (routes: Record<string, Route>) => setupHTTPServer(port, logger, routes);
