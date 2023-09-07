import * as dfns from '~/lib/date-fns';
import { appLogger } from '~/lib/logger';
import { Type, type Static } from '~/lib/typebox';

import prisma from '~/lib/prisma';
import {
  Recurrence,
  type Namespace,
  type TaskActivity,
  type Prisma,
  type Task,
  type Template,
} from '~/lib/prisma';

import { calcNextDate } from '~/models/recurrence';

import { ArgumentError } from '~/types/errors';

import { TaskTemplateBody, getTemplateById } from './templates';

// #region Input types

type InputActivity = Pick<Prisma.TaskActivityCreateWithoutTaskInput, 'type' | 'message' | 'data'>;

/**
 * TypeBox schema for edition tasks
 */
export const InputTaskBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  template: TaskTemplateBody,
  extends: Type.String({ minLength: 1 }),
  targets: Type.Array(
    Type.String({ format: 'email' }),
  ),
  recurrence: Type.Enum(Recurrence),
  nextRun: Type.String({ format: 'date-time' }),
  enabled: Type.Optional(
    Type.Boolean(),
  ),
});
type InputTaskBodyType = Static<typeof InputTaskBody>;

/**
 * TypeBox schema for creating tasks
 */
export const CreateTaskBody = Type.Intersect([
  InputTaskBody,
  Type.Object({
    namespace: Type.String({ minLength: 1 }),
  }),
]);

// #endregion

// #region Output types

type LastExtended = { id: Template['id'], name: Template['name'], tags: Template['tags'] } | null;

export type TaskList = (
  Pick<Task, 'id' | 'name' | 'namespaceId' | 'recurrence' | 'nextRun' | 'lastRun' | 'enabled' | 'createdAt' | 'updatedAt'>
  & { tags: Template['tags'] }
)[];

type FullTask = Pick<Task, 'id' | 'name' | 'template' | 'targets' | 'recurrence' | 'nextRun' | 'lastRun' | 'enabled' | 'createdAt' | 'updatedAt'>
& {
  namespace: Pick<Namespace, 'id' | 'name' | 'logoId' | 'createdAt' | 'updatedAt'>,
  extends: Pick<Template, 'id' | 'name' | 'tags' | 'createdAt' | 'updatedAt'>,
  lastExtended: LastExtended,
  activity: TaskActivity[],
};

// #endregion

// #region Methods

const prismaTaskSelect = {
  id: true,
  name: true,
  template: true,
  targets: true,
  recurrence: true,
  lastExtended: true,
  nextRun: true,
  lastRun: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,

  extends: {
    select: {
      id: true,
      name: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  namespace: {
    select: {
      id: true,
      name: true,
      logoId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  activity: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.TaskSelect;

/**
 * Get count of tasks in DB
 *
 * @param namespace The namespace of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns The task count
 */
export const getCountTask = (
  namespaceIds?: Namespace['id'][],
): Promise<number> => prisma.task.count({
  where: {
    namespaceId: {
      in: namespaceIds,
    },
  },
});

/**
 * Get all tasks in DB
 *
 * @param opts Requests options
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns Tasks list
 */
// TODO[feat]: Custom sort
export const getAllTasks = async (
  opts?: {
    count?: number,
    previous?: Task['id'],
  },
  namespaceIds?: Namespace['id'][],
): Promise<TaskList> => {
  const tasks = await prisma.task.findMany({
    take: opts?.count,
    skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
    cursor: opts?.previous ? { id: opts.previous } : undefined,
    select: {
      id: true,
      name: true,
      namespaceId: true,
      recurrence: true,
      nextRun: true,
      lastRun: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,

      extendedId: true,
      lastExtended: true,
    },
    where: {
      namespaceId: {
        in: namespaceIds,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return Promise.all(
    // Add tags from extended or last extended
    tasks.map(async ({ extendedId, lastExtended, ...task }) => {
      const lE = lastExtended as LastExtended;
      if (lE && lE.tags.length > 0) {
        return {
          ...task,
          tags: lE.tags,
        };
      }

      const extended = await getTemplateById(extendedId);
      return {
        ...task,
        tags: extended?.tags ?? [],
      };
    }),
  );
};

/**
 * Get tasks to generate at the given date
 *
 * @param date A precise date
 *
 * @returns Tasks to generate
 */
export const getAllTasksToGenerate = async (
  date: Date | string,
): Promise<Task[]> => prisma.task.findMany({
  where: {
    enabled: true,
    nextRun: {
      equals: date,
    },
  },
});

/**
 * Get specific task in DB
 *
 * @param id The id of the task
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns Task
 */
export const getTaskById = (id: Task['id'], namespaceIds?: Namespace['id'][]): Promise<FullTask | null> => prisma.task.findFirst({
  where: {
    id,
    namespaceId: {
      in: namespaceIds,
    },
  },
  select: prismaTaskSelect,
}) as Promise<FullTask | null>;

/**
 * Create task in DB
 *
 * @param data The input data
 * @param creator The user creating the task
 * @param id Wanted id
 *
 * @returns The created task
 */
export const createTask = async (
  input: Static<typeof CreateTaskBody>,
  creator: string,
  id?: string,
): Promise<FullTask> => {
  const {
    namespace: namespaceId,
    extends: extendedId,
    nextRun,
    ...data
  } = input;

  let nR = nextRun && dfns.parseISO(nextRun);
  if (!nR) {
    nR = calcNextDate(new Date(), data.recurrence);
  }

  const task = await prisma.task.create({
    data: {
      ...data,
      id,
      namespaceId,
      extendedId,
      nextRun: nR,
      activity: {
        create: { type: 'creation', message: `Tâche créée par ${creator}` },
      },
    },
    select: prismaTaskSelect,
  });

  appLogger.verbose(`[models] Task "${id}" created`);
  return task as FullTask;
};

/**
 * Delete specific task in DB
 *
 * @param id The id of the task
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns The edited task
 */
export const deleteTaskById = async (id: Task['id'], namespaceIds?: Namespace['id'][]): Promise<FullTask | null> => {
  // Check if task exist
  const existingTask = await getTaskById(id, namespaceIds);
  if (!existingTask) {
    return null;
  }

  const task = await prisma.task.delete({
    where: {
      id,
    },
    select: prismaTaskSelect,
  });

  appLogger.verbose(`[models] Task "${id}" deleted`);
  return task as FullTask;
};

/**
 * Edit task in DB with custom history entry
 *
 * @param id The id of the task
 * @param data The input data
 * @param entry The new history entry. If not provided, edit is considered as "silent"
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns The edited task, or null if task doesn't exist
 */
export const editTaskByIdWithHistory = async (
  id: Task['id'],
  input: InputTaskBodyType & { lastRun?: Task['lastRun'] },
  entry?: InputActivity,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => {
  const { nextRun, extends: extendedId, ...data } = input;

  // Check if task exist
  const existingTask = await getTaskById(id, namespaceIds);
  if (!existingTask) {
    return null;
  }

  // Check if "parent" template exist
  if (typeof data.template === 'object' && 'extends' in data.template && !await getTemplateById(`${data.template.extends}`)) {
    throw new ArgumentError(`No template named "${data.template.extends}" was found`);
  }

  let nR = typeof nextRun === 'object' ? nextRun : dfns.parseISO(nextRun);
  const isNextRunChanged = !dfns.isSameDay(nR, existingTask.nextRun);
  if (isNextRunChanged && dfns.isBefore(nR, new Date())) {
    throw new ArgumentError('Body is not valid: "nextRun" must be greater than "now" or stays unmodified');
  }

  // If next run isn't changed...
  if (!isNextRunChanged) {
    //  ... but recurrence changed, update nextRun
    if (data.recurrence !== existingTask.recurrence) {
      nR = calcNextDate(existingTask.lastRun ?? new Date(), data.recurrence);
    }

    // ... but task is re-enabled
    if (data.enabled && existingTask.enabled === false) {
      const today = dfns.endOfDay(new Date());
      nR = existingTask.nextRun;
      while (dfns.isBefore(nR, today)) {
        nR = calcNextDate(nR, existingTask.recurrence);
      }
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      extendedId,
      nextRun: nR,
      activity: entry && { create: { ...entry, createdAt: dfns.formatISO(new Date()) } },
    },
    select: prismaTaskSelect,
  });

  appLogger.verbose(`[models] Task "${id}" edited`);
  return task as FullTask;
};

/**
 * Edit task in DB
 *
 * @param data The input data
 * @param id The id of the task
 * @param editor The user editing the task. Used for creating default history
 * @param namespaceIds The namespaces of the task. If provided,
 * will restrict search to the namespace provided
 *
 * @returns The edited task, or null if task doesn't exist
 */
export const editTaskById = (
  id: Task['id'],
  data: InputTaskBodyType,
  editor: string,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => editTaskByIdWithHistory(
  id,
  data,
  { type: 'edition', message: `Tâche éditée par ${editor}` },
  namespaceIds,
);

// #endregion
