import type { ReportRenderErrorNamesType } from '@ezreeport/models/reports';

import TypedError from '~/models/errors';

// oxlint-disable-next-line import/no-default-export
export default class RenderError extends TypedError {
  constructor(
    message: string,
    public override name: ReportRenderErrorNamesType = 'UnknownError',
    cause?: unknown
  ) {
    super(message, 'RenderError', cause);
  }
}
