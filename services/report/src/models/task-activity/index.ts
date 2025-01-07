import prisma, { Prisma } from '~/lib/prisma';
import { ensureSchema } from '~/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import {
  TaskActivity,
  type TaskActivityType,
  type TaskActivityQueryFiltersType,
  type InputTaskActivityType,
  type TaskActivityIncludeFieldsType,
} from './types';

function applyFilters(filters: TaskActivityQueryFiltersType) {
  const where: Prisma.TaskActivityWhereInput = {};

  if (filters.taskId) {
    where.task = where.task || {};
    where.task.id = filters.taskId;
  }

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

function applyIncludes(fields: TaskActivityIncludeFieldsType[]) {
  const include: Prisma.TaskActivityInclude = {};

  if (fields.includes('task.namespace')) {
    const entries = Object.keys(prisma.namespace.fields).map((k) => [k, true]);
    const namespace = Object.fromEntries(entries) as Prisma.NamespaceSelect;

    namespace.fetchLogin = false;
    namespace.fetchOptions = false;
    include.task = { include: { namespace: { select: namespace } } };
  }

  if (fields.includes('task') && !include.task) {
    include.task = true;
  }

  return include;
}

/**
 * Get all task activity
 *
 * @param filters Filters options
 * @param include Fields to include
 * @param pagination Pagination options
 *
 * @returns All activity following pagination
 */
export async function getAllActivity(
  filters?: TaskActivityQueryFiltersType,
  include?: TaskActivityIncludeFieldsType[],
  pagination?: PaginationType,
): Promise<TaskActivityType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskActivityFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Apply includes
  if (include) {
    prismaQuery.include = applyIncludes(include);
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

      data: data.data ?? Prisma.DbNull,
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
export async function countActivity(filters?: TaskActivityQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.TaskActivityCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  const result = await prisma.taskActivity.count({
    ...prismaQuery,
    select: { id: true },
  });

  return result.id;
}
