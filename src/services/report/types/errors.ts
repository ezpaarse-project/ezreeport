/* eslint-disable max-classes-per-file */
import { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  code: StatusCodes;

  constructor(message: string, code: StatusCodes) {
    super(message);
    this.code = code;
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

export class ConflitError extends HTTPError {
  constructor(message: string) {
    super(message, StatusCodes.CONFLICT);
  }
}
