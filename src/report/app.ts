import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import config from './lib/config';
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

const app = express();
const port = config.get('port');

app.use(
  express.json(),
  corsMiddleware,
  loggerMiddleware,
  formatMiddleware,
);

app.use('/templates', templatesRouter);
app.use('/tasks', tasksRouter);
app.use('/history', historyRouter);
app.use('/reports', filesRouter);
app.use('/queues', queuesRouter);
app.use('/crons', cronsRouter);
app.use('/unsubscribe', unsubscribeRouter);
app.use('/health', healthRouter);
app.use('/me', authRouter);

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
