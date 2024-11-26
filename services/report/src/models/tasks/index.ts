import prisma, { Prisma } from '~/lib/prisma';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { ensureSchema } from '~/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import { Template } from '~/models/templates/types';

import {
  Task,
  type TaskType,
  type InputTaskType,
  type TaskQueryFiltersType,
} from './types';

const logger = appLogger.child({ scope: 'models', model: 'tasks' });

const { id: defaultTemplateId } = config.defaultTemplate;

function applyFilters(filters: TaskQueryFiltersType) {
  const where: Prisma.TaskWhereInput = {};

  where.extendedId = filters.extendedId;

  if (filters.query) {
    where.name = { contains: filters.query, mode: 'insensitive' as Prisma.QueryMode };
  }

  if (filters.namespaceId) {
    where.namespaceId = { in: filters.namespaceId };
  }

  if (filters.targets) {
    where.targets = {
      hasEvery: filters.targets.length > 0 ? filters.targets : undefined,
      isEmpty: filters.targets.length <= 0 ? true : undefined,
    };
  }

  if (filters['nextRun.from'] || filters['nextRun.to']) {
    where.nextRun = {
      gte: filters['nextRun.from'],
      lte: filters['nextRun.to'],
    };
  }

  return where;
}

/**
 * Get all tasks
 *
 * @param filters Filters options
 * @param pagination Pagination options
 *
 * @returns All tasks following pagination
 */
export async function getAllTasks(
  filters?: TaskQueryFiltersType,
  pagination?: PaginationType,
): Promise<TaskType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Fetch data
  const data = await prisma.task.findMany(prismaQuery);

  // Ensure data
  const tasks = await Promise.all(
    data.map((task) => ensureSchema(Task, task, (t) => `Failed to parse task ${t.id}`)),
  );
  return tasks;
}

/**
 * Get one task
 *
 * @param id The task's id
 *
 * @returns The found task, or `null` if not found
 */
export async function getTask(id: string): Promise<TaskType | null> {
  const task = await prisma.task.findUnique({ where: { id } });

  return task && ensureSchema(Task, task);
}

/**
 * Create a new task, throws if constraint is broken
 *
 * @param data The task's data
 *
 * @returns The created task
 */
export async function createTask(data: InputTaskType): Promise<TaskType> {
  const task = await prisma.task.create({
    data: {
      ...data,

      extendedId: undefined,
      extends: { connect: { id: data.extendedId } },

      namespaceId: undefined,
      namespace: { connect: { id: data.namespaceId } },

      lastExtended: data.lastExtended === null ? Prisma.DbNull : data.lastExtended,
    },
  });

  logger.debug({
    id: task.id,
    action: 'Created',
    msg: 'Created',
  });

  return ensureSchema(Task, task);
}

/**
 * Edit a task, throws if task doesn't exists or if constraint is broken
 *
 * @param id Task's id
 * @param data The task's data
 *
 * @returns The edited task
 */
export async function editTask(id: string, data: InputTaskType): Promise<TaskType> {
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,

      extendedId: undefined,
      extends: { connect: { id: data.extendedId } },

      namespaceId: undefined,
      namespace: { connect: { id: data.namespaceId } },

      lastExtended: data.lastExtended ?? Prisma.DbNull,
    },
  });

  logger.debug({
    id: task.id,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(Task, task);
}

/**
 * Delete a task, throws if task doesn't exists
 *
 * @param id Task's id
 *
 * @returns The deleted task
 */
export async function deleteTask(id: string): Promise<TaskType> {
  const task = await prisma.task.delete({ where: { id } });

  logger.debug({
    id: task.id,
    action: 'Deleted',
    msg: 'Deleted',
  });

  return ensureSchema(Task, task);
}

/**
 * Get count of tasks
 *
 * @param filters Filters options
 *
 * @returns Count of tasks
 */
export function countTasks(filters?: TaskQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.TaskCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  return prisma.task.count(prismaQuery);
}

/**
 * Get if task exists
 *
 * @param id The task's id
 *
 * @returns True if task exists
 */
export async function doesTaskExist(id: string): Promise<boolean> {
  return (await prisma.task.count({ where: { id } })) > 0;
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
  nextRun?: Date,
  enabled?: boolean,
): Promise<TaskType> {
  const task = await prisma.task.update({
    where: { id },
    data: {
      lastRun,
      nextRun,
      enabled,
    },
  });

  return ensureSchema(Task, task);
}

/**
 * Unlinks a task from its template.
 *
 * @param id The ID of the task to unlink.
 *
 * @return A promise that resolves to the updated task.
 */
export async function unlinkTaskFromTemplate(id: string): Promise<TaskType> {
  const rawTask = await prisma.task.findUniqueOrThrow({ where: { id } });
  const rawTemplate = await prisma.template.findUniqueOrThrow({
    where: { id: rawTask.extendedId },
  });

  const task = await ensureSchema(Task, rawTask, (t) => `Failed to parse task ${t.id}`);
  const template = await ensureSchema(Template, rawTemplate, (t) => `Failed to parse template ${t.id}`);

  // eslint-disable-next-line no-restricted-syntax
  for (const { at, ...layout } of (task.template.inserts ?? [])) {
    template.body.layouts.splice(at, 0, layout);
  }
  task.template.inserts = template.body.layouts.map((l, at) => ({ ...l, at }));

  const result = await prisma.task.update({
    where: { id },
    data: {
      template: task.template,
      extendedId: defaultTemplateId,
      lastExtended: {
        id: template.id,
        name: template.name,
        tags: template.tags,
      },
    },
  });

  logger.debug({
    id: task.id,
    oldId: task.extendedId,
    newId: config.defaultTemplate.id,
    action: 'Unlinked',
    msg: 'Unlinked',
  });

  return ensureSchema(Task, result);
}
