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
  startOfYear,
  endOfYear,
  setDefaultOptions,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';

setDefaultOptions({ locale: fr, weekStartsOn: 1 });

//! THIS FILE IS A DUPLICATE OF src/services/report/models/recurrence.ts

export type Period = {
  start: Date,
  end: Date,
};

/**
 * Get previous period based on Recurrence
 *
 * @param Recurrence Recurrence list (`this.$ezReeport.sdk.tasks.Recurrence`)
 * @param today The today's date
 * @param recurrence The recurrence
 *
 * @returns The period
 */
export const calcPeriod = (
  Recurrence: typeof tasks.Recurrence,
  today: Date,
  recurrence: tasks.Recurrence,
): Period => {
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
