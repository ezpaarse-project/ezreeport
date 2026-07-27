import type { ReportErrorTypesType } from '@ezreeport/models/reports';

// oxlint-disable-next-line import/no-default-export
export default abstract class TypedError extends Error {
  constructor(
    message: string,
    public type: ReportErrorTypesType,
    cause?: unknown
  ) {
    super(message, { cause });
  }

  override toString(): string {
    return `${this.type} - ${super.toString()}`;
  }
}
