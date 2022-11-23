import type { RequestHandler } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { sendError } from '../lib/elastic/apm';
import { ArgumentError, HTTPError, NotFoundError } from '../types/errors';

/**
 * API formatter middleware
 */
const middleware: RequestHandler = (req, res, next) => {
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
  res.errorJson = (error: Error) => {
    const err = error;
    let code = StatusCodes.INTERNAL_SERVER_ERROR;

    if (err instanceof NotFoundError) {
      code = StatusCodes.NOT_FOUND;
    } else if (err instanceof ArgumentError) {
      code = StatusCodes.BAD_REQUEST;
    }

    if (code >= 500) {
      sendError(err, req, res);
    }

    res.sendJson(
      {
        message: error.message,
      },
      err instanceof HTTPError ? err.code : code,
    );
  };

  next();
};

export default middleware;
