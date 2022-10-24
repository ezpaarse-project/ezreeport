import type { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  code: StatusCodes;

  constructor(message: string, code: StatusCodes) {
    super(message);
    this.code = code;
  }
}
