import type { TimeUnit } from 'vega-lite/build/src/timeunit';

import { Recurrence } from '~/lib/prisma';
import * as dfns from '~/lib/date-fns';
import { ReportPeriodType } from '~/models/reports/types';

/**
 * Calculate next run date for the task
 *
 * @param initial Initial date of the task
 * @param recurrence The task recurrence
 *
 * @returns The new date of the task
 */
export function calcNextDateFromRecurrence(initial: Date, recurrence: Recurrence): Date {
  const duration: dfns.Duration = {};

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
}

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
  recurrence: Recurrence,
  offset = 0,
): ReportPeriodType {
  switch (recurrence) {
    case Recurrence.DAILY: {
      const target = dfns.add(today, { days: offset });
      return { start: dfns.startOfDay(target), end: dfns.endOfDay(target) };
    }

    case Recurrence.WEEKLY: {
      const target = dfns.add(today, { weeks: offset });
      return { start: dfns.startOfWeek(target), end: dfns.endOfWeek(target) };
    }

    case Recurrence.MONTHLY: {
      const target = dfns.add(today, { months: offset });
      return { start: dfns.startOfMonth(target), end: dfns.endOfMonth(target) };
    }

    case Recurrence.QUARTERLY: {
      const target = dfns.add(today, { months: 3 * offset });
      return { start: dfns.startOfQuarter(target), end: dfns.endOfQuarter(target) };
    }

    case Recurrence.BIENNIAL: {
      const target = dfns.add(today, { months: 6 * offset });
      const year = dfns.getYear(target);
      const midYear = new Date(year, 5, 30);
      if (dfns.isAfter(target, midYear)) {
        return { start: midYear, end: dfns.endOfYear(midYear) };
      }
      return { start: dfns.startOfYear(midYear), end: midYear };
    }

    case Recurrence.YEARLY: {
      const target = dfns.add(today, { years: offset });
      return { start: dfns.startOfYear(target), end: dfns.endOfYear(target) };
    }

    default:
      throw new Error('Recurrence not found');
  }
}

/**
 * Calculate interval needed for Elastic's aggregations
 *
 * @param recurrence The recurrence
 *
 * @returns The interval
 */
export function calcElasticIntervalFromRecurrence(recurrence: Recurrence): 'hour' | 'day' | 'month' {
  switch (recurrence) {
    case Recurrence.DAILY:
      return 'hour';

    case Recurrence.WEEKLY:
    case Recurrence.MONTHLY:
      return 'day';

    case Recurrence.QUARTERLY:
    case Recurrence.BIENNIAL:
    case Recurrence.YEARLY:
      return 'month';

    default:
      throw new Error('Recurrence not found');
  }
}

type VegaFormat = { timeUnit: TimeUnit, format?: string };

/**
 * Calculate format needed for Vega
 *
 * @param recurrence The recurrence
 *
 * @returns The interval
 */
export function calcVegaFormatFromRecurrence(recurrence: Recurrence): VegaFormat {
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
}

export { Recurrence };
