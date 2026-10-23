import { Prisma, type Recurrence } from '@ezreeport/database/types';
import { ensureArray } from '@ezreeport/models/lib/utils';
import { ensureSchema } from '@ezreeport/models/lib/zod';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import prisma from '~/lib/prisma';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';
import { Template } from '~/models/templates/types';

import {
  type InputTaskType,
  Task,
  type TaskIncludeFieldsType,
  type TaskQueryFiltersType,
  type TaskType,
} from './types';

const logger = appLogger.child({ model: 'tasks', scope: 'models' });

const { id: defaultTemplateId } = config.defaultTemplate;

function applyFilters(filters: TaskQueryFiltersType): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    extendedId: filters.extendedId,
  };

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

  if (filters['extends.tags']) {
    where.extends = {
      tags: { some: { id: { in: filters['extends.tags'] } } },
    };
  }

  if (filters.recurrence) {
    where.recurrence = filters.recurrence;
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

  if (fields.includes('extends.locale')) {
    extended = extended || {};
    extended.locale = true;
  }

  if (fields.includes('namespace')) {
    const entries = Object.keys(prisma.namespace.fields).map((key) => [
      key,
      true,
    ]);
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
  pagination?: PaginationType
): Promise<TaskType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskFindManyArgs =
    buildPaginatedRequest(pagination);

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
    data.map((task) =>
      ensureSchema(Task, task, () => `Failed to parse task ${task.id}`)
    )
  );
  return tasks;
}

/**
 * Get one task
 *
 * @param id The task's id
 * @param include Fields to include
 *
 * @returns The found task, or `null` if not found
 */
export async function getTask(
  id: string,
  include?: TaskIncludeFieldsType[]
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
  data: InputTaskType & { id?: string }
): Promise<TaskType> {
  const task = await prisma.task.create({
    data: {
      ...data,

      extendedId: undefined,
      extends: { connect: { id: data.extendedId } },
      lastExtended:
        data.lastExtended === null ? Prisma.DbNull : data.lastExtended,
      namespace: { connect: { id: data.namespaceId } },
      namespaceId: undefined,
    },
  });

  logger.debug({
    action: 'Created',
    id: task.id,
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
export async function editTask(
  id: string,
  data: InputTaskType
): Promise<TaskType> {
  const task = await prisma.task.update({
    data: {
      ...data,

      extendedId: undefined,
      extends: { connect: { id: data.extendedId } },
      lastExtended: data.lastExtended ?? Prisma.DbNull,
      namespace: { connect: { id: data.namespaceId } },
      namespaceId: undefined,
    },
    where: { id },
  });

  logger.debug({
    action: 'Updated',
    id: task.id,
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
    action: 'Deleted',
    id: task.id,
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
export async function countTasks(
  filters?: TaskQueryFiltersType
): Promise<number> {
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
  const count = await prisma.task.count({
    select: { id: true },
    where: { id },
  });

  return count.id > 0;
}

/**
 * Get if a task with given data already exists
 *
 * @param namespaceId Namespace's id
 * @param recurrence Task's recurrence
 * @param templateId Template's id
 * @param index Task's index
 *
 * @returns True if task exists
 */
export async function doesSimilarTaskExist(
  namespaceId: string,
  recurrence: Recurrence,
  templateId: string,
  index: string
): Promise<boolean> {
  const data = await prisma.task.findFirst({
    where: {
      extendedId: templateId,
      namespaceId,
      recurrence,
    },
  });

  if (!data) {
    return false;
  }

  const task = await ensureSchema(Task, data);
  return task.template.index === index;
}

/**
 * Unlinks a task from its template.
 *
 * @param id The ID of the task to unlink.
 *
 * @returns A promise that resolves to the updated task.
 */
export async function unlinkTaskFromTemplate(id: string): Promise<TaskType> {
  const { extends: rawTemplate, ...rawTask } =
    await prisma.task.findUniqueOrThrow({
      include: { extends: true },
      where: { id },
    });

  const task = await ensureSchema(
    Task,
    rawTask,
    (tsk) => `Failed to parse task ${tsk.id}`
  );
  const template = await ensureSchema(
    Template,
    rawTemplate,
    (tpl) => `Failed to parse template ${tpl.id}`
  );

  const tags = await prisma.templateTag.findMany({
    select: {
      color: true,
      id: true,
      name: true,
    },
    where: {
      templates: { every: { id: template.id } },
    },
  });

  for (const { at, ...layout } of task.template.inserts ?? []) {
    template.body.layouts.splice(at, 0, layout);
  }
  task.template.inserts = template.body.layouts.map((layout, at) => ({
    ...layout,
    at,
  }));

  const result = await prisma.task.update({
    data: {
      extendedId: defaultTemplateId,
      lastExtended: {
        id: template.id,
        name: template.name,
        tags,
      },
      template: task.template,
    },
    where: { id },
  });

  logger.debug({
    action: 'Unlinked',
    id: task.id,
    msg: 'Unlinked',
    newId: config.defaultTemplate.id,
    oldId: task.extendedId,
  });

  return ensureSchema(Task, result);
}
