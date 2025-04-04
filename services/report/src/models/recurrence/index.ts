import { RecurrenceType } from '@ezreeport/models/recurrence';
import * as dfns from '@ezreeport/dates';

export * from '@ezreeport/models/lib/periods';

/**
 * Calculate next run date for the task
 *
 * @param initial Initial date of the task
 * @param recurrence The task recurrence
 *
 * @returns The new date of the task
 */
export function calcNextDateFromRecurrence(initial: Date, recurrence: RecurrenceType): Date {
  const duration: dfns.Duration = {};

  switch (recurrence) {
    case 'DAILY':
      duration.days = 1;
      break;
    case 'WEEKLY':
      duration.weeks = 1;
      break;
    case 'MONTHLY':
      duration.months = 1;
      break;
    case 'QUARTERLY':
      duration.months = 3;
      break;
    case 'BIENNIAL':
      duration.months = 6;
      break;
    case 'YEARLY':
      duration.years = 1;
      break;
    default:
      throw new Error('Recurrence not found');
  }

  return dfns.add(initial, duration);
}
