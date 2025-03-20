/* eslint-disable max-classes-per-file */
import { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  constructor(message: string, public statusCode: StatusCodes, options?: ErrorOptions) {
    super(message, options);
  }
}

export class NotFoundError extends HTTPError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, StatusCodes.NOT_FOUND, options);
  }
}

export class ArgumentError extends HTTPError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, StatusCodes.BAD_REQUEST, options);
  }
}

export class ConflictError extends HTTPError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, StatusCodes.CONFLICT, options);
  }
}
