import type { RequestHandler } from 'express';
import { getReasonPhrase, ReasonPhrases, StatusCodes } from 'http-status-codes';
import { CustomError } from '../types/errors';

/**
 * API formatter middleware
 */
const middleware: RequestHandler = (_req, res, next) => {
  res.sendJson = (content: any) => {
    res.status(StatusCodes.OK).json({
      status: {
        code: StatusCodes.OK,
        message: ReasonPhrases.OK,
      },
      content,
    });
  };
  res.errorJson = (error: CustomError | Error) => {
    const err = error instanceof CustomError ? error : new CustomError(error.message, 500);
    res.status(err.code).json({
      status: {
        code: err.code,
        message: getReasonPhrase(err.code),
      },
      content: {
        message: error.message,
      },
    });
  };

  next();
};

export default middleware;
