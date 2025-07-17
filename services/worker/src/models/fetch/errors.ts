import type {
  ReportFetchErrorMetaType,
  ReportFetchErrorNamesType,
} from '@ezreeport/models/reports';

import TypedError from '~/models/errors';

export default class FetchError extends TypedError {
  constructor(
    message: string,
    public override name: ReportFetchErrorNamesType = 'UnknownError',
    public override cause?: ReportFetchErrorMetaType
  ) {
    super(message, 'FetchError', { cause });
  }
}
