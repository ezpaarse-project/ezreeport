import {
  History,
  Recurrence,
  type Prisma,
  type Task
} from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime';
import {
  endOfDay,
  formatISO, isBefore,
  isSameDay
} from 'date-fns';
import Joi from 'joi';
import { join } from 'node:path';
import config from '../lib/config';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { calcNextDate } from '../lib/recurrence';
import { ArgumentError } from '../types/errors';
import { templateDBSchema } from './templates';

// TODO[feat]: More checks to make custom errors

const { templatesDir } = config.get('report');

type InputTask = Pick<Prisma.TaskCreateInput, 'name' | 'template' | 'targets' | 'recurrence' | 'nextRun' | 'enabled'>;
type InputHistory = Pick<Prisma.HistoryCreateWithoutTaskInput, 'type' | 'message' | 'data'>;

/**
 * Joi schema
 */
const taskSchema = Joi.object<Prisma.TaskCreateInput>({
  name: Joi.string().trim().required(),
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

/**
 * Get all tasks in DB
 *
 * @param opts Requests options
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns Tasks list
 */
// TODO[feat]: Custom sort
export const getAllTasks = async <Keys extends Array<keyof Task>>(
  opts?: {
    count?: number,
    previous?: Task['id'],
    select?: Keys,
    filter?: Omit<Prisma.TaskWhereInput, 'institution'>
  },
  institution?: Task['institution'],
): Promise<Pick<Task, Keys[number]>[]> => {
  try {
    // TODO[refactor]: any other way ?
    const select = opts?.select && opts.select.reduce(
      (prev, key) => ({ ...prev, [key]: true }),
      {} as Prisma.TaskSelect,
    );

    await prisma.$connect();

    const tasks = await prisma.task.findMany({
      take: opts?.count,
      skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
      cursor: opts?.previous ? { id: opts.previous } : undefined,
      select,
      where: {
        ...(opts?.filter ?? {}),
        institution,
      },
      orderBy: {
        createdAt: 'asc',
      },
    }) as Pick<Task, Keys[number]>[];

    await prisma.$disconnect();
    return tasks;
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      logger.error(`[prisma] ${error.message.trim()}`);
      throw new Error('An error occured with DB client. See server logs for more information.');
    } else {
      throw error;
    }
  }
};

/**
 * Get specific task in DB
 *
 * @param id The id of the task
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns Task
 */
export const getTaskById = async (id: Task['id'], institution?: Task['institution']): Promise<(Task & { history: History[] }) | null> => {
  await prisma.$connect();

  const task = await prisma.task.findFirst({
    where: {
      id,
      institution,
    },
    include: {
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  await prisma.$disconnect();
  return task;
};

/**
 * Create task in DB
 *
 * @param data The input data
 * @param creator The user creating the task
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns The created task
 */
export const createTask = async (data: unknown, creator: string, institution: Task['institution']): Promise<Task> => {
  // Validate body
  if (!isValidTask(data)) {
    // As validation throws an error, this line shouldn't be called
    return {} as Task;
  }

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

  const task = await prisma.task.create({
    data: {
      ...data,
      nextRun,
      institution,
      history: {
        create: { type: 'creation', message: `Tâche créée par ${creator}` },
      },
    },
    include: {
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  await prisma.$disconnect();
  return task;
};

/**
 * Delete specific task in DB
 *
 * @param id The id of the task
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns The edited task
 */
export const deleteTaskById = async (id: Task['id'], institution?: Task['institution']): Promise<Task | null> => {
  // Check if task exist
  const task = await getTaskById(id, institution);
  if (!task) {
    return null;
  }

  await prisma.$connect();

  const deletedTask = await prisma.task.delete({
    where: {
      id,
    },
    include: {
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  await prisma.$disconnect();
  return deletedTask;
};

/**
 * Edit task in DB with custom history entry
 *
 * @param id The id of the task
 * @param data The input data
 * @param entry The new history entry. If not provided, edit is considered as "silent"
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns The edited task, or null if task doesn't exist
 */
export const editTaskByIdWithHistory = async (
  id: Task['id'],
  data: InputTask & { lastRun?: Task['lastRun'] },
  entry?: InputHistory,
  institution?: Task['institution'],
) => {
  // Check if task exist
  const task = await getTaskById(id, institution);
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

  await prisma.$connect();

  const editedTask = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      nextRun,
      history: entry && { create: { ...entry, createdAt: formatISO(new Date()) } },
    },
    include: {
      history: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  await prisma.$disconnect();
  return editedTask;
};

/**
 * Edit task in DB
 *
 * @param data The input data
 * @param id The id of the task
 * @param editor The user editing the task. Used for creating default history
 * @param institution The institution of the task. If provided,
 * will restrict search to the instituion provided
 *
 * @returns The edited task, or null if task doesn't exist
 */
export const editTaskById = (
  id: Task['id'],
  data: unknown,
  editor: string,
  institution?: Task['institution'],
) => {
  // Validate body
  if (!isValidTask(data)) {
    // As validation throws an error, this line shouldn't be called
    return Promise.resolve(null);
  }

  return editTaskByIdWithHistory(
    id,
    data,
    { type: 'edition', message: `Tâche éditée par ${editor}` },
    institution,
  );
};
