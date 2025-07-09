import * as dfns from '@ezreeport/dates';
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
  offset = 0,
): ReportPeriodType {
  switch (recurrence) {
    case 'DAILY': {
      const target = dfns.add(today, { days: offset });
      return { start: dfns.startOfDay(target), end: dfns.endOfDay(target) };
    }

    case 'WEEKLY': {
      const target = dfns.add(today, { weeks: offset });
      return { start: dfns.startOfWeek(target), end: dfns.endOfWeek(target) };
    }

    case 'MONTHLY': {
      const target = dfns.add(today, { months: offset });
      return { start: dfns.startOfMonth(target), end: dfns.endOfMonth(target) };
    }

    case 'QUARTERLY': {
      const target = dfns.add(today, { months: 3 * offset });
      return { start: dfns.startOfQuarter(target), end: dfns.endOfQuarter(target) };
    }

    case 'BIENNIAL': {
      const target = dfns.add(today, { months: 6 * offset });
      const year = dfns.getYear(target);
      const midYear = new Date(year, 5, 30);
      if (dfns.isAfter(target, midYear)) {
        const start = dfns.add(midYear, { days: 1 });
        return { start: dfns.startOfDay(start), end: dfns.endOfYear(midYear) };
      }
      return { start: dfns.startOfYear(midYear), end: dfns.endOfDay(midYear) };
    }

    case 'YEARLY': {
      const target = dfns.add(today, { years: offset });
      return { start: dfns.startOfYear(target), end: dfns.endOfYear(target) };
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
