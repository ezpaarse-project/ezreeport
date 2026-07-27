import { endOfDay } from '@ezreeport/dates';
import { calcNextDateFromRecurrence } from '@ezreeport/models/lib/periods';
import { ensureSchema } from '@ezreeport/models/lib/zod';
import { RecurrenceOffset } from '@ezreeport/models/recurrence';
import { Task, type TaskType } from '@ezreeport/models/tasks';

import prisma from '~/lib/prisma';

/**
 * Get tasks to generate for a day
 *
 * @param day The day
 *
 * @returns The tasks with their data
 */
export async function getTasksToGenerate(day: Date) {
  const tasks = await prisma.task.findMany({
    include: {
      extends: true,
      namespace: true,
    },
    where: {
      enabled: true,
      nextRun: {
        lte: endOfDay(day),
      },
    },
  });

  return tasks;
}

/**
 * Update task data after generation
 *
 * @param id Task's id
 * @param lastRun Last run date
 * @param nextRun Next run date
 * @param enabled Is task enabled
 *
 * @returns The updated task
 */
export async function editTaskAfterGeneration(
  id: string,
  lastRun?: Date,
  enabled?: boolean
): Promise<TaskType> {
  let nextRun: Date | undefined;
  if (lastRun) {
    const data = await prisma.task.findUniqueOrThrow({
      select: {
        recurrence: true,
        recurrenceOffset: true,
      },
      where: { id },
    });

    nextRun = calcNextDateFromRecurrence(
      lastRun,
      data.recurrence,
      RecurrenceOffset.safeParse(data.recurrenceOffset).data
    );
  }

  const task = await prisma.task.update({
    data: {
      enabled,
      lastRun,
      nextRun,
    },
    where: { id },
  });

  return ensureSchema(Task, task);
}
