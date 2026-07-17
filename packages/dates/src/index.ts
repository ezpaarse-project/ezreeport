import { setDefaultOptions } from 'date-fns';
import * as dfnsConstants from 'date-fns/constants';

setDefaultOptions({ weekStartsOn: 1 });

export * from 'date-fns';
export * as locales from 'date-fns/locale';

export const constants = {
  ...dfnsConstants,
  // Date-fns is missing the "semester" granularity
  monthsInSemester: 6 as const,
};
