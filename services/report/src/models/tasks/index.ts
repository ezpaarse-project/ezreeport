import prisma, { Prisma } from '~/lib/prisma';
import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { ensureSchema } from '~common/lib/zod';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import { Template } from '~/models/templates/types';

import {
  Task,
  type TaskType,
  type InputTaskType,
  type TaskQueryFiltersType,
  type TaskIncludeFieldsType,
} from './types';
import { ensureArray } from '~common/lib/utils';
import { calcNextDateFromRecurrence } from '../recurrence';

const logger = appLogger.child({ scope: 'models', model: 'tasks' });

const { id: defaultTemplateId } = config.defaultTemplate;

function applyFilters(filters: TaskQueryFiltersType) {
  const where: Prisma.TaskWhereInput = {};

  where.extendedId = filters.extendedId;

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { namespace: { name: { contains: filters.query, mode: 'insensitive' } } },
    ];
  }

  if (filters.namespaceId) {
    where.namespaceId = { in: filters.namespaceId };
  }

  if (filters.enabled != null) {
    where.enabled = filters.enabled;
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

function applyIncludes(fields: TaskIncludeFieldsType[]): Prisma.TaskInclude {
  let namespace: Prisma.NamespaceSelect | undefined;
  let extended: Prisma.TemplateSelect | undefined;

  if (fields.includes('extends.tags')) {
    extended = extended || {};
    extended.tags = true;
  }

  if (fields.includes('namespace')) {
    const entries = Object.keys(prisma.namespace.fields).map((k) => [k, true]);
    namespace = Object.fromEntries(entries) as Prisma.NamespaceSelect;

    namespace.fetchLogin = false;
    namespace.fetchOptions = false;
  }

  return {
    extends: extended && { select: extended },
    namespace: namespace && { select: namespace },
  };
}

/**
 * Get all tasks
 *
 * @param filters Filters options
 * @param include Fields to include
 * @param pagination Pagination options
 *
 * @returns All tasks following pagination
 */
export async function getAllTasks(
  filters?: TaskQueryFiltersType,
  include?: TaskIncludeFieldsType[],
  pagination?: PaginationType,
): Promise<TaskType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Apply includes
  if (include) {
    prismaQuery.include = applyIncludes(include);
  }

  // Since name isn't unique, we need to have another sort
  if (pagination?.sort === 'name') {
    const orderBy = ensureArray(prismaQuery.orderBy || []);
    orderBy.push({ namespace: { name: 'asc' } });
    prismaQuery.orderBy = orderBy;
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
export async function getTask(
  id: string,
  include?: TaskIncludeFieldsType[],
): Promise<TaskType | null> {
  const prismaQuery: Prisma.TaskFindUniqueArgs = { where: { id } };

  // Apply includes
  if (include) {
    prismaQuery.include = applyIncludes(include);
  }

  const task = await prisma.task.findUnique(prismaQuery);

  return task && ensureSchema(Task, task);
}

/**
 * Create a new task, throws if constraint is broken
 *
 * @param data The task's data
 *
 * @returns The created task
 */
export async function createTask(
  data: InputTaskType & { id?: string },
): Promise<TaskType> {
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
export async function countTasks(filters?: TaskQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.TaskCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  const result = await prisma.task.count({
    ...prismaQuery,
    select: { id: true },
  });

  return result.id;
}

/**
 * Get if task exists
 *
 * @param id The task's id
 *
 * @returns True if task exists
 */
export async function doesTaskExist(id: string): Promise<boolean> {
  const count = await prisma.task.count({ where: { id }, select: { id: true } });

  return count.id > 0;
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
  enabled?: boolean,
): Promise<TaskType> {
  let nextRun: Date | undefined;
  if (lastRun) {
    const { recurrence } = await prisma.task.findUniqueOrThrow({ where: { id } });
    nextRun = calcNextDateFromRecurrence(lastRun, recurrence);
  }

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
  const {
    extends: rawTemplate,
    ...rawTask
  } = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: { extends: true },
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
