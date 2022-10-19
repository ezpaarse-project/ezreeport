import type { RequestHandler } from 'express';
import logger from '../lib/logger';

/**
 * Logging middleware
 */
const middleware: RequestHandler = (req, res, next) => {
  // FIXME: res.statusCode is always 200
  logger.info(`${req.method} ${req.url} - ${res.statusCode}`);
  next();
};

export default middleware;
