import type { ReportErrorTypesType } from '@ezreeport/models/reports';

export default abstract class TypedError extends Error {
  constructor(
    message: string,
    public type: ReportErrorTypesType,
    cause?: unknown,
  ) {
    super(message, { cause });
  }

  toString() {
    return `${this.type} - ${super.toString()}`;
  }
}
