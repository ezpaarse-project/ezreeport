import express from 'express';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import logger from './lib/logger';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';
import openapi from './openapi.json';
import orgsRouter from './routes/institutions';
import tasksRouter from './routes/tasks';

const app = express();
const port = 8080;

app.use(express.json(), loggerMiddleware, formatMiddleware);

app.use('/institutions', orgsRouter);
app.use('/tasks', tasksRouter);

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
  logger.info(`Service listening on port ${port}`);
});
