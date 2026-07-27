import { Prisma } from '@ezreeport/database/types';
import { ensureSchema } from '@ezreeport/models/lib/zod';

import prisma from '~/lib/prisma';

import {
  type InputTaskActivityType,
  TaskActivity,
  type TaskActivityType,
} from './types';

/**
 * Create a new activity, throws if constraint is broken
 *
 * @param data The activity's data
 *
 * @returns The created activity
 */
export async function createActivity(
  data: InputTaskActivityType
): Promise<TaskActivityType> {
  const activity = await prisma.taskActivity.create({
    data: {
      ...data,

      data: data.data ?? Prisma.DbNull,
      task: { connect: { id: data.taskId } },
      taskId: undefined,
    },
  });

  return ensureSchema(TaskActivity, activity);
}
