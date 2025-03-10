import type { TimeUnit } from 'vega-lite/build/src/timeunit';

import type { RecurrenceType } from '~common/types/recurrence';

/**
 * Calculate interval needed for Elastic's aggregations
 *
 * @param recurrence The recurrence
 *
 * @returns The interval
 */
export function calcElasticIntervalFromRecurrence(recurrence: RecurrenceType): 'hour' | 'day' | 'month' {
  switch (recurrence) {
    case 'DAILY':
      return 'hour';

    case 'WEEKLY':
    case 'MONTHLY':
      return 'day';

    case 'QUARTERLY':
    case 'BIENNIAL':
    case 'YEARLY':
      return 'month';

    default:
      throw new Error('Recurrence not found');
  }
}

/**
 * Calculate format needed for Vega
 *
 * @param recurrence The recurrence
 *
 * @returns The interval
 */
export function calcVegaFormatFromRecurrence(
  recurrence: RecurrenceType,
): { timeUnit: TimeUnit, format?: string } {
  // Formats : https://github.com/d3/d3-time-format#locale_format
  switch (recurrence) {
    case 'DAILY':
      return { timeUnit: 'hours' };
    case 'WEEKLY':
    case 'MONTHLY':
      return { timeUnit: 'yearmonthdate', format: '%d %b %Y' };
    case 'QUARTERLY':
    case 'BIENNIAL':
    case 'YEARLY':
      return { timeUnit: 'yearmonth' };

    default:
      throw new Error('Recurrence not found');
  }
}
