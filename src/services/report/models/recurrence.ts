import type { TimeUnit } from 'vega-lite/build/src/timeunit';
import { Recurrence } from '~/.prisma/client';
import {
  add,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  getYear,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear
} from '~/lib/date-fns';

/**
 * Calculate next run date for the task
 *
 * @param initial Initial date of the task
 * @param recurrence The task recurrence
 *
 * @returns The new date of the task
 */
export const calcNextDate = (initial: Date, recurrence: Recurrence): Date => {
  const duration: Duration = {};

  switch (recurrence) {
    case Recurrence.DAILY:
      duration.days = 1;
      break;
    case Recurrence.WEEKLY:
      duration.weeks = 1;
      break;
    case Recurrence.MONTHLY:
      duration.months = 1;
      break;
    case Recurrence.QUARTERLY:
      duration.months = 3;
      break;
    case Recurrence.BIENNIAL:
      duration.months = 6;
      break;
    case Recurrence.YEARLY:
      duration.years = 1;
      break;
    default:
      throw new Error('Recurrence not found');
  }

  return add(initial, duration);
};

/**
 * Get previous period based on Reccurrence
 *
 * @param today The today's date
 * @param recurrence The reccurence
 *
 * @returns The period
 */
export const calcPeriod = (today: Date, recurrence: Recurrence): Interval => {
  let period;

  switch (recurrence) {
    case Recurrence.DAILY: {
      const target = add(today, { days: -1 });
      period = { start: startOfDay(target), end: endOfDay(target) };
      break;
    }
    case Recurrence.WEEKLY: {
      const target = add(today, { weeks: -1 });
      period = { start: startOfWeek(target), end: endOfWeek(target) };
      break;
    }
    case Recurrence.MONTHLY: {
      const target = add(today, { months: -1 });
      period = { start: startOfMonth(target), end: endOfMonth(target) };
      break;
    }
    case Recurrence.QUARTERLY: {
      const target = add(today, { months: -3 });
      period = { start: startOfQuarter(target), end: endOfQuarter(target) };
      break;
    }
    case Recurrence.BIENNIAL: {
      const year = getYear(today);
      const midYear = new Date(year, 5, 30);
      if (isAfter(today, midYear)) {
        // Target is first half of current year
        period = { start: startOfYear(midYear), end: midYear };
      } else {
        // Target is second half of previous year
        const target = add(midYear, { years: -1, days: 1 });
        period = { start: target, end: endOfYear(target) };
      }
      break;
    }
    case Recurrence.YEARLY: {
      const target = add(today, { years: -1 });
      period = { start: startOfYear(target), end: endOfYear(target) };
      break;
    }
    default:
      throw new Error('Recurrence not found');
  }

  return period;
};

/**
 * Calculate interval needed for Elastic's aggregations
 *
 * @param recurrence The recurrence
 *
 * @returns The interval
 */
export const calcElasticInterval = (recurrence: Recurrence): 'hour' | 'day' | 'month' => {
  switch (recurrence) {
    case Recurrence.DAILY:
      return 'hour';

    case Recurrence.WEEKLY:
    case Recurrence.MONTHLY: // TODO: or week
      return 'day';

    case Recurrence.QUARTERLY:
    case Recurrence.BIENNIAL:
    case Recurrence.YEARLY:
      return 'month';

    default:
      throw new Error('Recurrence not found');
  }
};

/**
 * Calculate format needed for Vega
 *
 * @param recurrence The recurrence
 *
 * @returns The interval
 */
export const calcVegaFormat = (recurrence: Recurrence): { timeUnit: TimeUnit, format?: string } => {
  // Formats : https://github.com/d3/d3-time-format#locale_format
  switch (recurrence) {
    case Recurrence.DAILY:
      return { timeUnit: 'hours' };
    case Recurrence.WEEKLY:
    case Recurrence.MONTHLY:
      return { timeUnit: 'yearmonthdate', format: '%d %b %Y' };
    case Recurrence.QUARTERLY:
    case Recurrence.BIENNIAL:
    case Recurrence.YEARLY:
      return { timeUnit: 'yearmonth' };

    default:
      throw new Error('Recurrence not found');
  }
};
