import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import config from './lib/config';
import './lib/date-fns'; // Setup default options for date-fns
import './lib/elastic/apm'; // Setup Elastic's APM for monitoring
import logger from './lib/logger';
import corsMiddleware from './middlewares/cors';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';
import openapi from './openapi.json';
import authRouter from './routes/auth';
import cronsRouter from './routes/crons';
import filesRouter from './routes/files';
import healthRouter from './routes/health';
import historyRouter from './routes/history';
import queuesRouter from './routes/queues';
import tasksRouter from './routes/tasks';
import templatesRouter from './routes/templates';
import unsubscribeRouter from './routes/unsubscribe';
import { HTTPError } from './types/errors';

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
  .use('/templates', templatesRouter)
  .use('/tasks', tasksRouter)
  .use('/history', historyRouter)
  .use('/reports', filesRouter)
  .use('/queues', queuesRouter)
  .use('/crons', cronsRouter)
  .use('/unsubscribe', unsubscribeRouter)
  .use('/health', healthRouter)
  .use('/me', authRouter)

  /**
   * API Docs
   */
  .use('/doc/openapi.json', (_req, res) => res.json(openapi))
  .use('/doc', swaggerUi.serve, swaggerUi.setup(openapi))

  /**
   * 404 Fallback
   */
  .use('*', (_req, res) => {
    res.errorJson(new HTTPError('Route not found', StatusCodes.NOT_FOUND));
  })

  /**
   * Start server
   */
  .listen(port, () => {
    logger.info(`[http] Service listening on port ${port} in ${process.uptime().toFixed(2)}s`);
  });
