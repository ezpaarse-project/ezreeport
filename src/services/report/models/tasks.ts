import Joi from 'joi';
import { join } from 'node:path';
import config from '~/lib/config';
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
import { templateDBSchema } from './templates';

const { templatesDir } = config.get('report');

type InputTask = Pick<Prisma.TaskCreateInput, 'name' | 'template' | 'targets' | 'recurrence' | 'nextRun' | 'enabled'>;
type InputHistory = Pick<Prisma.HistoryCreateWithoutTaskInput, 'type' | 'message' | 'data'>;
type FullTask = Omit<Task, 'namespaceId'> & {
  namespace: Pick<Namespace, 'id' | 'name' | 'logoId' | 'createdAt' | 'updatedAt'>,
  history: History[]
};

/**
 * Joi schema
 */
const taskSchema = Joi.object<Prisma.TaskCreateInput>({
  name: Joi.string().trim().required(),
  namespace: Joi.string(),
  template: templateDBSchema.required(),
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

const createTaskSchema = taskSchema.append(
  {
    namespace: Joi.string().required(),
  },
);

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

const prismaNamespaceSelect = {
  select: {
    id: true,
    name: true,
    logoId: true,
    createdAt: true,
    updatedAt: true,
  },
};

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
  include: {
    namespace: prismaNamespaceSelect,
    history: {
      orderBy: {
        createdAt: 'asc',
      },
    },
  },
});

/**
 * Create task in DB
 *
 * @param data The input data
 * @param creator The user creating the task
 *
 * @returns The created task
 */
export const createTask = async (
  data: unknown,
  creator: string,
): Promise<FullTask> => {
  // Validate body
  if (!isValidCreateTask(data)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullTask;
  }
  const { namespace, ...taskData } = data as InputTask & { namespace: string };

  // Check if not trying to access unwanted file
  if (typeof data.template === 'object' && 'extends' in data.template) {
    const extendsPath = join(templatesDir, `${data.template.extends}.json`);
    if (new RegExp(`^${templatesDir}/.*\\.json$`, 'i').test(extendsPath) === false) {
      throw new ArgumentError(`Task's layout must be in the "${templatesDir}" folder. Resolved: "${extendsPath}"`);
    }
  }

  let { nextRun } = data;
  if (!nextRun) {
    nextRun = calcNextDate(new Date(), data.recurrence);
  }

  await prisma.$connect();

  return prisma.task.create({
    data: {
      ...taskData,
      namespaceId: namespace,
      nextRun,
      history: {
        create: { type: 'creation', message: `Tâche créée par ${creator}` },
      },
    },
    include: {
      namespace: prismaNamespaceSelect,
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
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
    include: {
      namespace: prismaNamespaceSelect,
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
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

  // Check if not trying to access unwanted file
  if (typeof data.template === 'object' && 'extends' in data.template) {
    const extendsPath = join(templatesDir, `${data.template.extends}.json`);
    if (new RegExp(`^${templatesDir}/.*\\.json$`, 'i').test(extendsPath) === false) {
      throw new ArgumentError(`Task's layout must be in the "${templatesDir}" folder. Resolved: "${extendsPath}"`);
    }
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
    include: {
      namespace: prismaNamespaceSelect,
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
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
