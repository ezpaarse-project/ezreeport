import type { RequestHandler } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import {
  ArgumentError,
  ConflitError,
  HTTPError,
  NotFoundError
} from '~/types/errors';

/**
 * API formatter middleware
 */
const middleware: RequestHandler = (req, res, next) => {
  res.sendJson = (content: unknown, code = StatusCodes.OK, meta?: unknown) => {
    if (code === StatusCodes.NO_CONTENT || (!content && !meta)) {
      res.status(StatusCodes.NO_CONTENT).send();
      return;
    }

    res.status(code).json({
      status: {
        code,
        message: getReasonPhrase(code),
        apiVersion: res.apiVersion,
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
    } else if (err instanceof ConflitError) {
      code = StatusCodes.CONFLICT;
    }

    res.sendJson(
      {
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack?.split('\n').map((t) => t.trim()) : undefined,
      },
      err instanceof HTTPError ? err.code : code,
    );
  };

  next();
};

export default middleware;
