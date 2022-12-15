//! Should be synced with report
export enum Recurrence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIENNIAL = 'BIENNIAL',
  YEARLY = 'YEARLY',
}

// TODO[feat]: locales
/**
 * Transform recurrence into string using given locale
 *
 * @param recurrence The recurrence
 * @param _locale (currently unsued) The locale of string
 *
 * @return The recurrence string
 */
export const recurrenceToStr = (recurrence: Recurrence, _locale = 'fr') => {
  switch (recurrence) {
    case Recurrence.DAILY:
      return 'quotidien';
    case Recurrence.WEEKLY:
      return 'hebdomadaire';
    case Recurrence.MONTHLY:
      return 'mensuel';
    case Recurrence.QUARTERLY:
      return 'trimestriel';
    case Recurrence.BIENNIAL:
      return 'semestriel';
    case Recurrence.YEARLY:
      return 'annuel';

    default:
      throw new Error('Recurrence not found');
  }
};
