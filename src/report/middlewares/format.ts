import type { RequestHandler } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { CustomError } from '../types/errors';

/**
 * API formatter middleware
 */
const middleware: RequestHandler = (_req, res, next) => {
  res.sendJson = (content: any, code = StatusCodes.OK) => {
    res.status(code).json({
      status: {
        status: {
          code,
          message: getReasonPhrase(code),
        },
        content,
      },
    });
  };
  res.errorJson = (error: CustomError | Error) => {
    const err = error instanceof CustomError ? error : new CustomError(error.message, 500);
    res.sendJson({
      message: error.message,
    }, err.code);
  };

  next();
};

export default middleware;
