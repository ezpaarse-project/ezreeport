import { endOfDay } from '@ezreeport/dates';

import prisma from '~/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function getTasksToGenerate(day: Date) {
  const tasks = await prisma.task.findMany({
    where: {
      nextRun: {
        lte: endOfDay(day),
      },
      enabled: true,
    },
    include: {
      namespace: true,
      extends: true,
    },
  });

  return tasks;
}
