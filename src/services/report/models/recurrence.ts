import type { TimeUnit } from 'vega-lite/build/src/timeunit';
import { Recurrence } from '~/lib/prisma';
import * as dfns from '~/lib/date-fns';

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

  return dfns.add(initial, duration);
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
  switch (recurrence) {
    case Recurrence.DAILY: {
      const target = dfns.add(today, { days: -1 });
      return { start: dfns.startOfDay(target), end: dfns.endOfDay(target) };
    }

    case Recurrence.WEEKLY: {
      const target = dfns.add(today, { weeks: -1 });
      return { start: dfns.startOfWeek(target), end: dfns.endOfWeek(target) };
    }

    case Recurrence.MONTHLY: {
      const target = dfns.add(today, { months: -1 });
      return { start: dfns.startOfMonth(target), end: dfns.endOfMonth(target) };
    }

    case Recurrence.QUARTERLY: {
      const target = dfns.add(today, { months: -3 });
      return { start: dfns.startOfQuarter(target), end: dfns.endOfQuarter(target) };
    }

    case Recurrence.BIENNIAL: {
      const year = dfns.getYear(today);
      const midYear = new Date(year, 5, 30);
      if (dfns.isAfter(today, midYear)) {
        // Target is first half of current year
        return { start: dfns.startOfYear(midYear), end: midYear };
      }
      // Target is second half of previous year
      const target = dfns.add(midYear, { years: -1, days: 1 });
      return { start: target, end: dfns.endOfYear(target) };
    }

    case Recurrence.YEARLY: {
      const target = dfns.add(today, { years: -1 });
      return { start: dfns.startOfYear(target), end: dfns.endOfYear(target) };
    }

    default:
      throw new Error('Recurrence not found');
  }
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
