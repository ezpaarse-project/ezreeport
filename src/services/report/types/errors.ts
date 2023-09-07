/* eslint-disable max-classes-per-file */
import { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  constructor(message: string, public statusCode: StatusCodes) {
    super(message);
  }
}

export class NotFoundError extends HTTPError {
  constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ArgumentError extends HTTPError {
  constructor(message: string) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class ConflictError extends HTTPError {
  constructor(message: string) {
    super(message, StatusCodes.CONFLICT);
  }
}
