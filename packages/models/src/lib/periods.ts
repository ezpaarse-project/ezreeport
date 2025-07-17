import {
  add,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  getYear,
  isAfter,
  endOfYear,
  startOfYear,
  type Duration,
} from '@ezreeport/dates';

import type { RecurrenceType } from '../types/recurrence';
import type { ReportPeriodType } from '../types/reports';

/**
 * Get period based on Recurrence
 *
 * @param today The today's date
 * @param recurrence The recurrence
 * @param offset The offset, negative for previous, positive for next, 0 for current
 *
 * @returns The period
 */
export function calcPeriodFromRecurrence(
  today: Date,
  recurrence: RecurrenceType,
  offset = 0
): ReportPeriodType {
  switch (recurrence) {
    case 'DAILY': {
      const target = add(today, { days: offset });
      return { start: startOfDay(target), end: endOfDay(target) };
    }

    case 'WEEKLY': {
      const target = add(today, { weeks: offset });
      return { start: startOfWeek(target), end: endOfWeek(target) };
    }

    case 'MONTHLY': {
      const target = add(today, { months: offset });
      return { start: startOfMonth(target), end: endOfMonth(target) };
    }

    case 'QUARTERLY': {
      const target = add(today, { months: 3 * offset });
      return { start: startOfQuarter(target), end: endOfQuarter(target) };
    }

    case 'BIENNIAL': {
      const target = add(today, { months: 6 * offset });
      const year = getYear(target);
      const midYear = new Date(year, 5, 30);
      if (isAfter(target, midYear)) {
        const start = add(midYear, { days: 1 });
        return { start: startOfDay(start), end: endOfYear(midYear) };
      }
      return { start: startOfYear(midYear), end: endOfDay(midYear) };
    }

    case 'YEARLY': {
      const target = add(today, { years: offset });
      return { start: startOfYear(target), end: endOfYear(target) };
    }

    default:
      throw new Error('Recurrence not found');
  }
}

/**
 * Calculate next run date for the task
 *
 * @param initial Initial date of the task
 * @param recurrence The task recurrence
 *
 * @returns The new date of the task
 */
export function calcNextDateFromRecurrence(
  initial: Date,
  recurrence: RecurrenceType
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
