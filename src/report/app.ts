import express from 'express';
import logger from './lib/logger';
import formatMiddleware from './middlewares/format';
import loggerMiddleware from './middlewares/logger';

const app = express();
const port = 8080;

app.use(loggerMiddleware, formatMiddleware);

/**
 * 404 Fallback
 */
app.use('*', (req, res) => {
  res.sendStatus(404);
});

app.listen(port, () => {
  logger.info(`Service listening on port ${port}`);
});
