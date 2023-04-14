import Joi from 'joi';
import {
  endOfDay,
  formatISO,
  isBefore,
  isSameDay
} from '~/lib/date-fns';
import prisma from '~/lib/prisma';
import {
  Recurrence,
  type Namespace,
  type History,
  type Prisma,
  type Task
} from '~/lib/prisma';
import { calcNextDate } from '~/models/recurrence';
import { ArgumentError } from '~/types/errors';
import { getTemplateByName, taskTemplateSchema } from './templates';

type InputTask = Pick<Prisma.TaskCreateInput, 'name' | 'template' | 'targets' | 'recurrence' | 'nextRun' | 'enabled'>;
type InputHistory = Pick<Prisma.HistoryCreateWithoutTaskInput, 'type' | 'message' | 'data'>;

/**
 * Joi schema
 */
const taskSchema = Joi.object<Prisma.TaskCreateInput>({
  name: Joi.string().trim().required(),
  namespace: Joi.string(),
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
  nextRun: Joi.date().iso().greater('now'),
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
const isValidTask = (data: unknown): data is InputTask => {
  const validation = taskSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

const createTaskSchema = taskSchema.append({
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
const isValidCreateTask = (data: unknown): data is (InputTask & { namespace: string }) => {
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
export const getCountTask = async (namespaceIds?: Namespace['id'][]): Promise<number> => {
  const count = await prisma.task.count({
    where: {
      namespaceId: {
        in: namespaceIds,
      },
    },
  });

  return count;
};

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
  data: unknown,
  creator: string,
  id?: string,
): Promise<FullTask> => {
  // Validate body
  if (!isValidCreateTask(data)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullTask;
  }
  const { namespace, ...taskData } = data as InputTask & { namespace: string };

  // Check if "parent" template exist
  if (typeof data.template === 'object' && 'extends' in data.template && !await getTemplateByName(`${data.template.extends}`)) {
    throw new ArgumentError(`No template named "${data.template.extends}" was found`);
  }

  let { nextRun } = data;
  if (!nextRun) {
    nextRun = calcNextDate(new Date(), data.recurrence);
  }

  await prisma.$connect();

  return prisma.task.create({
    data: {
      ...taskData,
      id,
      namespaceId: namespace,
      nextRun,
      history: {
        create: { type: 'creation', message: `Tâche créée par ${creator}` },
      },
    },
    select: prismaTaskSelect,
  });
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
  const task = await getTaskById(id, namespaceIds);
  if (!task) {
    return null;
  }

  return prisma.task.delete({
    where: {
      id,
    },
    select: prismaTaskSelect,
  });
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
  data: InputTask & { lastRun?: Task['lastRun'] },
  entry?: InputHistory,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => {
  // Check if task exist
  const task = await getTaskById(id, namespaceIds);
  if (!task) {
    return null;
  }

  // Check if "parent" template exist
  if (typeof data.template === 'object' && 'extends' in data.template && !await getTemplateByName(`${data.template.extends}`)) {
    throw new ArgumentError(`No template named "${data.template.extends}" was found`);
  }

  // If next run isn't changed but recurrence changed
  let { nextRun } = data;
  if (
    data.recurrence !== task.recurrence
      && (!data.nextRun || isSameDay(new Date(data.nextRun), task.nextRun))
  ) {
    nextRun = calcNextDate(task.lastRun ?? new Date(), data.recurrence);
  }

  // If next run isn't changed but task is re-enabled
  if (data.enabled && data.enabled !== task.enabled && !data.nextRun) {
    const today = endOfDay(new Date());
    nextRun = task.nextRun;
    while (isBefore(nextRun, today)) {
      nextRun = calcNextDate(nextRun, task.recurrence);
    }
  }

  // Falling back to task's nextRun
  if (nextRun === '') {
    nextRun = task.nextRun;
  }

  return prisma.task.update({
    where: { id },
    data: {
      ...data,
      nextRun,
      history: entry && { create: { ...entry, createdAt: formatISO(new Date()) } },
    },
    select: prismaTaskSelect,
  });
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
  data: unknown,
  editor: string,
  namespaceIds?: Namespace['id'][],
): Promise<FullTask | null> => {
  // Validate body
  if (!isValidTask(data)) {
    // As validation throws an error, this line shouldn't be called
    return Promise.resolve(null);
  }

  return editTaskByIdWithHistory(
    id,
    data,
    { type: 'edition', message: `Tâche éditée par ${editor}` },
    namespaceIds,
  );
};
