import { ensureSchema } from '@ezreeport/models/lib/zod';
import { Prisma } from '@ezreeport/database/types';

import prisma from '~/lib/prisma';

import {
  TaskActivity,
  type TaskActivityType,
  type InputTaskActivityType,
} from './types';

/**
 * Create a new activity, throws if constraint is broken
 *
 * @param data The activity's data
 *
 * @returns The created activity
 */
export async function createActivity(data: InputTaskActivityType): Promise<TaskActivityType> {
  const activity = await prisma.taskActivity.create({
    data: {
      ...data,

      taskId: undefined,
      task: { connect: { id: data.taskId } },

      data: data.data ?? Prisma.DbNull,
    },
  });

  return ensureSchema(TaskActivity, activity);
}
