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
  startOfYear,
  endOfYear,
  setDefaultOptions,
  isBefore,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';

setDefaultOptions({ locale: fr, weekStartsOn: 1 });

//! THIS FILE IS A DUPLICATE OF src/services/report/models/recurrence.ts

export type Period = {
  start: Date,
  end: Date,
};

const getMidYear = (date: Date | number) => new Date(getYear(date), 5, 30);

/**
 * Get period based on given Date
 *
*  @param Recurrence Recurrence list (`this.$ezReeport.sdk.tasks.Recurrence`)
 * @param target
 * @param recurrence The recurrence
 *
 * @returns The period
 */
export const calcPeriodByDate = (
  Recurrence: typeof tasks.Recurrence,
  target: Date,
  recurrence: tasks.Recurrence,
): Period => {
  let period;

  switch (recurrence) {
    case Recurrence.DAILY:
      period = { start: startOfDay(target), end: endOfDay(target) };
      break;

    case Recurrence.WEEKLY:
      period = { start: startOfWeek(target), end: endOfWeek(target) };
      break;

    case Recurrence.MONTHLY:
      period = { start: startOfMonth(target), end: endOfMonth(target) };
      break;

    case Recurrence.QUARTERLY:
      period = { start: startOfQuarter(target), end: endOfQuarter(target) };
      break;

    case Recurrence.BIENNIAL: {
      const midYear = getMidYear(target);
      if (isBefore(target, midYear)) {
        period = { start: startOfYear(midYear), end: midYear };
      } else {
        period = { start: add(midYear, { days: 1 }), end: endOfYear(target) };
      }
      break;
    }

    case Recurrence.YEARLY:
      period = { start: startOfYear(target), end: endOfYear(target) };
      break;

    default:
      throw new Error('Recurrence not found');
  }

  return period;
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
export const calcPeriodByRecurrence = (
  Recurrence: typeof tasks.Recurrence,
  today: Date,
  recurrence: tasks.Recurrence,
): Period => {
  let target = today;

  switch (recurrence) {
    case Recurrence.DAILY:
      target = add(today, { days: -1 });
      break;

    case Recurrence.WEEKLY:
      target = add(today, { weeks: -1 });
      break;

    case Recurrence.MONTHLY:
      target = add(today, { months: -1 });
      break;

    case Recurrence.QUARTERLY:
      target = add(today, { months: -3 });
      break;

    case Recurrence.BIENNIAL: {
      const midYear = getMidYear(today);
      if (isBefore(today, midYear)) {
        // Target is second half of previous year
        target = add(today, { years: -1 });
      } else {
        // Target is first half of current year
        target = add(today, { months: -6 });
      }
      break;
    }

    case Recurrence.YEARLY: {
      target = add(today, { years: -1 });
      break;
    }
    default:
      throw new Error('Recurrence not found');
  }

  return calcPeriodByDate(Recurrence, target, recurrence);
};
