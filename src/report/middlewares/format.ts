import type { RequestHandler } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { HTTPError } from '../types/errors';

/**
 * API formatter middleware
 */
const middleware: RequestHandler = (_req, res, next) => {
  res.sendJson = (content: unknown, code = StatusCodes.OK, meta?: unknown) => {
    res.status(code).json({
      status: {
        code,
        message: getReasonPhrase(code),
      },
      content,
      meta,
    });
  };
  res.errorJson = (error: HTTPError | Error) => {
    const err = error instanceof HTTPError ? error : new HTTPError(error.message, 500);
    res.sendJson({
      message: error.message,
    }, err.code);
  };

  next();
};

export default middleware;
