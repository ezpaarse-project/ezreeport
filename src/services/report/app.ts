import express from 'express';
import routes from './routes';
import config from './lib/config';
import './lib/date-fns'; // Setup default options for date-fns
import './lib/elastic/apm'; // Setup Elastic's APM for monitoring
import logger from './lib/logger';
import corsMiddleware from './middlewares/cors';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';

const port = config.get('port');

express()
  /**
   * General middlewares
   */
  .use(
    express.json(),
    corsMiddleware,
    loggerMiddleware,
    formatMiddleware,
  )

  /**
   * Router
   */
  .use('/', routes)

  /**
   * Start server
   */
  .listen(port, () => {
    logger.info(`[node] Service running in ${process.env.NODE_ENV} mode`);
    logger.info(`[http] Service listening on port ${port} in ${process.uptime().toFixed(2)}s`);
  });
