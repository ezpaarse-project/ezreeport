import type { ReportRenderErrorNamesType } from '@ezreeport/models/reports';

import TypedError from '~/models/errors';

export default class RenderError extends TypedError {
  constructor(
    message: string,
    public override name: ReportRenderErrorNamesType = 'UnknownError',
    cause?: unknown
  ) {
    super(message, 'RenderError', cause);
  }
}
