import express from 'express';
import swaggerUi from 'swagger-ui-express';
import logger from './lib/logger';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';
import openapi from './openapi.json';

const app = express();
const port = 8080;

app.use(loggerMiddleware, formatMiddleware);

app.use('/openapi.json', (_req, res) => res.json(openapi));
app.use('/', swaggerUi.serve, swaggerUi.setup(openapi));

/**
 * 404 Fallback
 */
app.use('*', (req, res) => {
  res.sendStatus(404);
});

app.listen(port, () => {
  logger.info(`Service listening on port ${port}`);
});
