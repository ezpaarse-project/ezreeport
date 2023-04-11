import type { RequestHandler } from 'express';
import { differenceInMilliseconds } from '~/lib/date-fns';
import { accessLogger as logger } from '~/lib/logger';

/**
 * Logging middleware
 */
const middleware: RequestHandler = (req, res, next) => {
  const start = new Date();

  res.once('finish', () => {
    const end = new Date();
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${differenceInMilliseconds(end, start)})`);
  });

  next();
};

export default middleware;
