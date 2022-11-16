import cors from 'cors';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import config from './lib/config';
import './lib/datefns'; // Setup default options for date-fns
import logger from './lib/logger';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';
import openapi from './openapi.json';
import cronsRouter from './routes/crons';
import filesRouter from './routes/files';
import queuesRouter from './routes/queues';
import tasksRouter from './routes/tasks';

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

app.use('/tasks', tasksRouter);
app.use('/reports', filesRouter);
app.use('/queues', queuesRouter);
app.use('/crons', cronsRouter);

app.use('/doc/openapi.json', (_req, res) => res.json(openapi));
app.use('/doc', swaggerUi.serve, swaggerUi.setup(openapi));

app.get('/ping', (_req, res) => {
  res.sendStatus(StatusCodes.NO_CONTENT);
});

/**
 * 404 Fallback
 */
app.use('*', (req, res) => {
  res.sendJson(null, 404);
});

app.listen(port, () => {
  logger.info(`[http] Service listening on port ${port}`);
});
