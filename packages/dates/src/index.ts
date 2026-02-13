import { setDefaultOptions } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as dfnsConstants from 'date-fns/constants';

setDefaultOptions({ locale: fr, weekStartsOn: 1 });

export * from 'date-fns';
export * as locales from 'date-fns/locale';

export const constants = {
  ...dfnsConstants,
  // date-fns is missing the "semester" granularity
  monthsInSemester: 6 as const,
};
