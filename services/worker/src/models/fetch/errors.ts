import type { ReportFetchErrorMetaType, ReportFetchErrorNamesType } from '@ezreeport/models/reports';

import TypedError from '~/models/errors';

export default class FetchError extends TypedError {
  constructor(
    message: string,
    public name: ReportFetchErrorNamesType = 'UnknownError',
    public cause?: ReportFetchErrorMetaType,
  ) {
    super(message, 'FetchError', { cause });
  }
}
