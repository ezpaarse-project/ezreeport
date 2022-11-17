/* eslint-disable max-classes-per-file */
import type { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  code: StatusCodes;

  constructor(message: string, code: StatusCodes) {
    super(message);
    this.code = code;
  }
}

export class NotFoundError extends Error {}

export class ArgumentError extends Error {}
