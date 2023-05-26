import type { RequestHandler } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { HTTPError } from '~/types/errors';

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
      apiVersion: res.apiVersion,
      status: {
        code,
        message: getReasonPhrase(code),
      },
      content,
      meta,
    });
  };
  res.errorJson = (error: HTTPError | Error) => {
    res.sendJson(
      {
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack?.split('\n').map((t) => t.trim()) : undefined,
      },
      error instanceof HTTPError ? error.code : StatusCodes.INTERNAL_SERVER_ERROR,
    );
  };

  next();
};

export default middleware;
