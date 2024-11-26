import prisma, { type Prisma } from '~/lib/prisma';
import { ensureSchema } from '~/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import {
  TaskActivity,
  type TaskActivityType,
  type TaskActivityQueryFiltersType,
  type InputTaskActivityType,
} from './types';

function applyFilters(filters: TaskActivityQueryFiltersType) {
  const where: Prisma.TaskActivityWhereInput = {};

  if (filters.extendedId) {
    where.task = where.task || {};
    where.task.extendedId = filters.extendedId;
  }

  if (filters.namespaceId) {
    where.task = where.task || {};
    where.task.namespaceId = { in: filters.namespaceId };
  }

  if (filters['createdAt.from'] || filters['createdAt.to']) {
    where.createdAt = {
      gte: filters['createdAt.from'],
      lte: filters['createdAt.to'],
    };
  }

  return where;
}

/**
 * Get all task activity
 *
 * @param filters Filters options
 * @param pagination Pagination options
 *
 * @returns All activity following pagination
 */
export async function getAllActivity(
  filters?: TaskActivityQueryFiltersType,
  pagination?: PaginationType,
): Promise<TaskActivityType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskActivityFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Fetch data
  const data = await prisma.taskActivity.findMany(prismaQuery);

  // Ensure data
  const activity = await Promise.all(
    data.map((log) => ensureSchema(TaskActivity, log, (t) => `Failed to parse task ${t.id}`)),
  );
  return activity;
}

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
    },
  });

  return ensureSchema(TaskActivity, activity);
}

/**
 * Get count of task activity
 *
 * @param filters Filters options
 *
 * @returns Count of activity
 */
export function countActivity(filters?: TaskActivityQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.TaskActivityCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  return prisma.taskActivity.count(prismaQuery);
}
