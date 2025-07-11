import type { ReportTemplateErrorNamesType } from '@ezreeport/models/reports';

import TypedError from '~/models/errors';

export default class TemplateError extends TypedError {
  constructor(
    message: string,
    public override name: ReportTemplateErrorNamesType = 'UnknownError'
  ) {
    super(message, 'TemplateError');
  }
}
