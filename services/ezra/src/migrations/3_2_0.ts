import { differenceInDays, differenceInMonths } from 'date-fns';

import type { MigrationData } from './common.js';

const name = '3.2.0';

const getOffset = async (recurrence: string, nextRun: string) => {
  const response = await fetch(
    `https://ezmesure.couperin.org/report/api/v2/recurrence/${recurrence}/period?reference=${nextRun}`
  );

  if (response.ok) {
    const { content } = await response.json();
    const months = differenceInMonths(nextRun, content.start);
    const days = Math.max(
      0,
      differenceInDays(nextRun, content.start) - 31 * months
    );
    return { months, days };
  }

  const { error } = await response.json();
  throw new Error(error.message);
};

/**
 * Migrate inserts
 *
 * @param tasks The original tasks
 *
 * @returns Migrated tasks
 */
const migrateTasks = (tasks: any[]) =>
  Promise.all(
    tasks.map(async (task: any) => ({
      ...task,
      recurrenceOffset: await getOffset(task.recurrence, task.nextRun),
    }))
  );

/**
 * Migrate data to 3.2.0's format
 *
 * @param data The data to migrate
 *
 * @returns Migrated data
 */
const migrate = async (data: MigrationData) => ({
  ...data,
  tasks: await migrateTasks(data.tasks),
});

export default {
  migrate,
  name,
};
