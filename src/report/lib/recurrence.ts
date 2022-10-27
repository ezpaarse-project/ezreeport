import { Recurrence } from '@prisma/client';
import {
  add,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  getDaysInYear,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear
} from 'date-fns';

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
      const startYear = startOfYear(today);
      const midYear = add(startYear, { days: getDaysInYear(today) / 2 });
      if (isAfter(today, midYear)) {
        // Target is first half of current year
        period = { start: startYear, end: midYear };
      } else {
        // Target is second half of previous year
        const target = add(midYear, { years: -1 });
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
