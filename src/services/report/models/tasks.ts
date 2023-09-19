import * as dfns from '~/lib/date-fns';
import { appLogger } from '~/lib/logger';
import { Type, type Static, Value } from '~/lib/typebox';

import prisma from '~/lib/prisma';
import {
  Recurrence,
  type Namespace,
  type TaskActivity,
  type Prisma,
  type Task as PrismaTask,
  type Template as PrismaTemplate,
} from '~/lib/prisma';

import { calcNextDate } from '~/models/recurrence';

import { ArgumentError } from '~/types/errors';

import { FullTemplateBody, TaskTemplate, getTemplateById } from './templates';

// #region Input types

type InputActivity = Pick<Prisma.TaskActivityCreateWithoutTaskInput, 'type' | 'message' | 'data'>;

/**
 * TypeBox schema for edition tasks
 */
export const InputTaskBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  template: TaskTemplate,
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

export type InputTaskBodyType = Static<typeof InputTaskBody>;

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

const LastExtended = Type.Intersect([
  Type.Object({ id: Type.String() }),
  Type.Pick(FullTemplateBody, ['name', 'tags']),
]);

export type TaskList = (
  Pick<PrismaTask, 'id' | 'name' | 'namespaceId' | 'recurrence' | 'nextRun' | 'lastRun' | 'enabled' | 'createdAt' | 'updatedAt'>
  & { tags: PrismaTemplate['tags'] }
)[];

type FullTask = Pick<PrismaTask, 'id' | 'name' | 'targets' | 'recurrence' | 'nextRun' | 'lastRun' | 'enabled' | 'createdAt' | 'updatedAt'>
& {
  template: Static<typeof TaskTemplate>,
  namespace: Pick<Namespace, 'id' | 'name' | 'logoId' | 'createdAt' | 'updatedAt'>,
  extends: Pick<PrismaTemplate, 'id' | 'name' | 'tags' | 'createdAt' | 'updatedAt'>,
  lastExtended: Static<typeof LastExtended>,
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
 * Cast Prisma's task into a standard Task
 *
 * @param data The data from Prisma
 *
 * @returns A standard Task
 */
const castFullTask = <T extends Omit<PrismaTask, 'extendedId' | 'namespaceId'>>(data: T): T & Pick<FullTask, 'template' | 'lastExtended'> => ({
  ...data,
  template: Value.Cast(TaskTemplate, data.template),
  lastExtended: data.lastExtended ? Value.Cast(LastExtended, data.lastExtended) : undefined,
});

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
    previous?: PrismaTask['id'],
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
      const lE = Value.Cast(LastExtended, lastExtended);
      if (lE?.tags && lE.tags.length > 0) {
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
): Promise<PrismaTask[]> => prisma.task.findMany({
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
export const getTaskById = async (id: PrismaTask['id'], namespaceIds?: Namespace['id'][]): Promise<FullTask | null> => {
  const task = await prisma.task.findFirst({
    where: {
      id,
      namespaceId: {
        in: namespaceIds,
      },
    },
    select: prismaTaskSelect,
  });

  if (!task) {
    return null;
  }

  return castFullTask(task);
};

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

  let nR = dfns.parseISO(nextRun);
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
  return castFullTask(task);
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
export const deleteTaskById = async (id: PrismaTask['id'], namespaceIds?: Namespace['id'][]): Promise<FullTask | null> => {
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
  return castFullTask(task);
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
export const patchTaskByIdWithHistory = async (
  id: PrismaTask['id'],
  input: Partial<InputTaskBodyType> & { lastRun?: PrismaTask['lastRun'] },
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

  let nR: Date = existingTask.nextRun;
  if (nextRun) {
    nR = dfns.parseISO(nextRun);
    const isNextRunChanged = !dfns.isSameDay(nR, existingTask.nextRun);
    if (isNextRunChanged && dfns.isBefore(nR, new Date())) {
      throw new ArgumentError('Body is not valid: "nextRun" must be greater than "now" or stays unmodified');
    }

    // If next run isn't changed...
    if (!isNextRunChanged) {
      //  ... but recurrence changed, update nextRun
      if (data.recurrence && data.recurrence !== existingTask.recurrence) {
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
  return castFullTask(task);
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
export const patchTaskById = (
  id: PrismaTask['id'],
  data: InputTaskBodyType,
  editor: string,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => patchTaskByIdWithHistory(
  id,
  data,
  { type: 'edition', message: `Tâche éditée par ${editor}` },
  namespaceIds,
);

// #endregion
