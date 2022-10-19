import type { StatusCodes } from 'http-status-codes';

export class CustomError extends Error {
  code: StatusCodes;

  constructor(message: string, code: StatusCodes) {
    super(message);
    this.code = code;
  }
}
