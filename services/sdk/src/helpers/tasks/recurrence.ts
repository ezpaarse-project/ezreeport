import { add, type Duration } from 'date-fns';
import type { TaskRecurrence } from '~/modules/tasks';

/**
 * Calculate next run date for the task
 *
 * @param initial Initial date of the task
 * @param recurrence The task recurrence
 *
 * @deprecated Please use the `recurrence` module
 * @see {@link getNextDateFromRecurrence}
 *
 * @returns The new date of the task
 */
export function calcNextDateFromRecurrence(
  initial: Date,
  recurrence: TaskRecurrence
): Date {
  const duration: Duration = {};

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

  return add(initial, duration);
}
