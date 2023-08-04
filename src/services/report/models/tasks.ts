import Joi from 'joi';
import { parseISO } from 'date-fns';
import * as dfns from '~/lib/date-fns';
import prisma from '~/lib/prisma';
import {
  Recurrence,
  type Namespace,
  type History,
  type Prisma,
  type Task,
} from '~/lib/prisma';
import { calcNextDate } from '~/models/recurrence';
import { ArgumentError } from '~/types/errors';
import { getTemplateByName, taskTemplateSchema } from './templates';
import { appLogger } from '~/lib/logger';

type InputTask = Pick<Prisma.TaskCreateInput, 'name' | 'template' | 'targets' | 'recurrence' | 'nextRun' | 'enabled'>;
type InputHistory = Pick<Prisma.HistoryCreateWithoutTaskInput, 'type' | 'message' | 'data'>;

/**
 * Joi schema
 */
const taskSchema = Joi.object<Prisma.TaskCreateInput>({
  name: Joi.string().trim().required(),
  template: taskTemplateSchema.required(),
  targets: Joi.array().items(Joi.string().trim().email()).required(),
  recurrence: Joi.string().valid(
    Recurrence.DAILY,
    Recurrence.WEEKLY,
    Recurrence.MONTHLY,
    Recurrence.QUARTERLY,
    Recurrence.BIENNIAL,
    Recurrence.YEARLY,
  ).required(),
  nextRun: Joi.date().iso().required(),
  enabled: Joi.boolean().default(true),
});

/**
 * Check if input data is a task
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isValidTask = (data: unknown): data is InputTask => {
  const validation = taskSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

const createTaskSchema = taskSchema.append({
  nextRun: Joi.date().iso().greater('now'),
  namespace: Joi.string().required(),
});

/**
 * Check if input data is a task creation
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isValidCreateTask = (data: unknown): data is (InputTask & { namespace: string }) => {
  const validation = createTaskSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

type FullTask = Pick<Task, 'id' | 'name' | 'template' | 'targets' | 'recurrence' | 'nextRun' | 'lastRun' | 'enabled' | 'createdAt' | 'updatedAt'> & {
  namespace: Pick<Namespace, 'id' | 'name' | 'logoId' | 'createdAt' | 'updatedAt'>,
  history: History[]
};

const prismaTaskSelect = {
  id: true,
  name: true,
  template: true,
  targets: true,
  recurrence: true,
  nextRun: true,
  lastRun: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,

  namespace: {
    select: {
      id: true,
      name: true,
      logoId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  history: {
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
export const getAllTasks = <Keys extends Array<keyof Task>>(
  opts?: {
    count?: number,
    previous?: Task['id'],
    select?: Keys,
    filter?: Omit<Prisma.TaskWhereInput, 'namespace'>
  },
  namespaceIds?: Namespace['id'][],
): Promise<Pick<Task, Keys[number]>[]> => {
  const select: Prisma.TaskSelect = opts?.select && Object.assign(
    {},
    ...opts.select.map((v) => ({
      [v]: true,
    })),
  );

  return prisma.task.findMany({
    take: opts?.count,
    skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
    cursor: opts?.previous ? { id: opts.previous } : undefined,
    select,
    where: {
      ...(opts?.filter ?? {}),
      namespaceId: {
        in: namespaceIds,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  }) as Promise<Pick<Task, Keys[number]>[]>;
};

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
});

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
  { namespace, nextRun, ...data }: InputTask & { namespace: string },
  creator: string,
  id?: string,
): Promise<FullTask> => {
  // Check if "parent" template exist
  if (typeof data.template === 'object' && 'extends' in data.template && !await getTemplateByName(`${data.template.extends}`)) {
    throw new ArgumentError(`No template named "${data.template.extends}" was found`);
  }

  let nR = nextRun;
  if (!nR) {
    nR = calcNextDate(new Date(), data.recurrence);
  }

  const task = await prisma.task.create({
    data: {
      ...data,
      id,
      namespaceId: namespace,
      nextRun: nR,
      history: {
        create: { type: 'creation', message: `Tâche créée par ${creator}` },
      },
    },
    select: prismaTaskSelect,
  });

  appLogger.verbose(`[models] Task "${id}" created`);
  return task;
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
  return task;
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
  { nextRun, ...data }: InputTask & { lastRun?: Task['lastRun'] },
  entry?: InputHistory,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => {
  // Check if task exist
  const existingTask = await getTaskById(id, namespaceIds);
  if (!existingTask) {
    return null;
  }

  // Check if "parent" template exist
  if (typeof data.template === 'object' && 'extends' in data.template && !await getTemplateByName(`${data.template.extends}`)) {
    throw new ArgumentError(`No template named "${data.template.extends}" was found`);
  }

  let nR = typeof nextRun === 'object' ? nextRun : parseISO(nextRun);
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
      nextRun: nR,
      history: entry && { create: { ...entry, createdAt: dfns.formatISO(new Date()) } },
    },
    select: prismaTaskSelect,
  });

  appLogger.verbose(`[models] Task "${id}" edited`);
  return task;
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
  data: InputTask,
  editor: string,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => editTaskByIdWithHistory(
  id,
  data,
  { type: 'edition', message: `Tâche éditée par ${editor}` },
  namespaceIds,
);
