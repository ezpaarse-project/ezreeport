import cors from 'cors';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import config from './lib/config';
import './lib/elastic/apm'; // Setup Elastic's APM for monitoring
import logger from './lib/logger';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';
import openapi from './openapi.json';
import cronsRouter from './routes/crons';
import filesRouter from './routes/files';
import healthRouter from './routes/health';
import queuesRouter from './routes/queues';
import tasksRouter from './routes/tasks';
import templatesRouter from './routes/templates';
import unsubscribeRouter from './routes/unsubscribe';
import { HTTPError } from './types/errors';

const allowedOrigins = (config.get('allowedOrigins')).split(',');

const app = express();
const port = 8080;

app.use(
  cors({
    origin: (origin, next) => {
      if (
        allowedOrigins[0] === '*'
        || (origin && allowedOrigins.indexOf(origin) !== -1)
      ) {
        next(null, true);
      } else {
        next(new Error('Not allowed by CORS'));
      }
    },
  }),
  express.json(),
  loggerMiddleware,
  formatMiddleware,
);

app.use('/templates', templatesRouter);
app.use('/tasks', tasksRouter);
app.use('/reports', filesRouter);
app.use('/queues', queuesRouter);
app.use('/crons', cronsRouter);
app.use('/unsubscribe', unsubscribeRouter);
app.use('/health', healthRouter);

app.use('/doc/openapi.json', (_req, res) => res.json(openapi));
app.use('/doc', swaggerUi.serve, swaggerUi.setup(openapi));

/**
 * 404 Fallback
 */
app.use('*', (_req, res) => {
  res.errorJson(new HTTPError('Route not found', StatusCodes.NOT_FOUND));
});

app.listen(port, () => {
  logger.info(`[http] Service listening on port ${port} in ${process.uptime().toFixed(2)}s`);
});
