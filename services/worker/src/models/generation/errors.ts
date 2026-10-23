import type { ReportTemplateErrorNamesType } from '@ezreeport/models/reports';

import TypedError from '~/models/errors';

// oxlint-disable-next-line import/no-default-export
export default class TemplateError extends TypedError {
  constructor(
    message: string,
    public override name: ReportTemplateErrorNamesType = 'UnknownError',
    cause?: unknown
  ) {
    super(message, 'TemplateError', cause);
  }
}
