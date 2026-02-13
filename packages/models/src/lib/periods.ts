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
  getDaysInMonth,
  type Duration,
  constants,
} from '@ezreeport/dates';

import type { RecurrenceOffsetType, RecurrenceType } from '../types/recurrence';
import type { ReportPeriodType } from '../types/reports';
import { limitNumber } from './utils';

/**
 * Get period based on Recurrence
 *
 * @param reference The date of reference
 * @param recurrence The recurrence
 * @param offset The offset, negative for previous, positive for next, 0 for current
 *
 * @returns The period
 */
export function calcPeriodFromRecurrence(
  reference: Date,
  recurrence: RecurrenceType,
  offset = 0
): ReportPeriodType {
  switch (recurrence) {
    case 'DAILY': {
      const target = add(reference, { days: offset });
      return { start: startOfDay(target), end: endOfDay(target) };
    }

    case 'WEEKLY': {
      const target = add(reference, { weeks: offset });
      return { start: startOfWeek(target), end: endOfWeek(target) };
    }

    case 'MONTHLY': {
      const target = add(reference, { months: offset });
      return { start: startOfMonth(target), end: endOfMonth(target) };
    }

    case 'QUARTERLY': {
      const target = add(reference, { months: 3 * offset });
      return { start: startOfQuarter(target), end: endOfQuarter(target) };
    }

    case 'BIENNIAL': {
      const target = add(reference, { months: 6 * offset });
      const year = getYear(target);
      const midYear = new Date(year, 5, 30);
      if (isAfter(target, midYear)) {
        const start = add(midYear, { days: 1 });
        return { start: startOfDay(start), end: endOfYear(midYear) };
      }
      return { start: startOfYear(midYear), end: endOfDay(midYear) };
    }

    case 'YEARLY': {
      const target = add(reference, { years: offset });
      return { start: startOfYear(target), end: endOfYear(target) };
    }

    default:
      throw new Error('Recurrence not found');
  }
}

const safeOffsetInMonth = (
  offset: RecurrenceOffsetType,
  targetMonth: Date
): Duration => {
  const daysInMonth = getDaysInMonth(targetMonth);
  return {
    days: limitNumber(0, offset.days ?? 0, daysInMonth - 1),
  };
};

const safeOffsetInYear = (
  offset: RecurrenceOffsetType,
  targetMonth: Date,
  monthsIn: number
): Duration => {
  const months = limitNumber(0, offset.months ?? 0, monthsIn - 1);

  return {
    months,
    ...safeOffsetInMonth(offset, add(targetMonth, { months })),
  };
};

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
  recurrence: RecurrenceType,
  offset: RecurrenceOffsetType = {}
): Date {
  const nextPeriod = calcPeriodFromRecurrence(initial, recurrence, 1);

  let safeOffset: Duration = {};
  switch (recurrence) {
    case 'DAILY':
      // DAILY can't have offsets, as it'll be sent... everyday...
      break;
    case 'WEEKLY':
      safeOffset = {
        days: limitNumber(0, offset.days ?? 0, constants.daysInWeek - 1),
      };
      break;
    case 'MONTHLY':
      safeOffset = safeOffsetInMonth(offset, nextPeriod.start);
      break;
    case 'QUARTERLY':
      safeOffset = safeOffsetInYear(
        offset,
        nextPeriod.start,
        constants.monthsInQuarter
      );
      break;
    case 'BIENNIAL':
      safeOffset = safeOffsetInYear(
        offset,
        nextPeriod.start,
        constants.monthsInSemester
      );
      break;
    case 'YEARLY':
      safeOffset = safeOffsetInYear(
        offset,
        nextPeriod.start,
        constants.monthsInYear
      );
      break;
    default:
      throw new Error('Recurrence not found');
  }

  return add(nextPeriod.start, safeOffset);
}
