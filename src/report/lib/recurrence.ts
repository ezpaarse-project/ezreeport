import { Recurrence } from '@prisma/client';
import { add } from 'date-fns';

/**
 * Calculate next run date for the task
 *
 * @param initial Initial date of the task
 * @param recurrence The task recurrence
 *
 * @returns The new date of the task
 */
const calcNextDate = (initial: Date, recurrence: Recurrence) => {
  let next = new Date(initial);

  switch (recurrence) {
    case Recurrence.DAILY:
      next = add(next, { days: 1 });
      break;
    case Recurrence.WEEKLY:
      next = add(next, { weeks: 1 });
      break;
    case Recurrence.MONTHLY:
      next = add(next, { months: 1 });
      break;
    case Recurrence.QUARTERLY:
      next = add(next, { months: 3 });
      break;
    case Recurrence.BIENNIAL:
      next = add(next, { months: 6 });
      break;
    case Recurrence.YEARLY:
      next = add(next, { years: 1 });
      break;
    default:
      break;
  }

  return next;
};

export default calcNextDate;
