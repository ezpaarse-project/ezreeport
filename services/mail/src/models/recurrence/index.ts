import type { RecurrenceType } from '@ezreeport/models/recurrence';

// TODO[feat]: locales
/**
 * Transform recurrence into string using given locale
 *
 * @param recurrence The recurrence
 * @param _locale (currently unused) The locale of string
 *
 * @return The recurrence string
 */
// eslint-disable-next-line import/prefer-default-export
export const recurrenceToStr = (recurrence: RecurrenceType, _locale = 'fr') => {
  switch (recurrence) {
    case 'DAILY':
      return 'quotidien';
    case 'WEEKLY':
      return 'hebdomadaire';
    case 'MONTHLY':
      return 'mensuel';
    case 'QUARTERLY':
      return 'trimestriel';
    case 'BIENNIAL':
      return 'semestriel';
    case 'YEARLY':
      return 'annuel';

    default:
      throw new Error('Recurrence not found');
  }
};
