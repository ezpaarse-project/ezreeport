import {
  History,
  Recurrence,
  type Prisma,
  type Task
} from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime';
import { formatISO } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { HTTPError } from '../types/errors';
import { layoutSchema, type LayoutJSON } from './layouts';

// TODO[feat]: More checks to make custom errors

type InputTask = Omit<Task, 'institution' | 'history' | 'createdAt' | 'updatedAt' | 'id' | 'lastRun'> & { layout: LayoutJSON };

/**
 * Joi schema
 */
const taskSchema = Joi.object<InputTask>({
  name: Joi.string().trim().required(),
  layout: layoutSchema.required(),
  targets: Joi.array().items(Joi.string().trim().email()).required(),
  recurrence: Joi.string().valid(
    Recurrence.DAILY,
    Recurrence.WEEKLY,
    Recurrence.MONTHLY,
    Recurrence.QUARTERLY,
    Recurrence.BIENNIAL,
    Recurrence.YEARLY,
  ).required(),
  nextRun: Joi.date().iso().greater('now').required(),
  enabled: Joi.boolean().default(true),
});

/**
 * Check if input data is a task
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 *
 * @throw If input data isn't a Task
 */
const isValidTask = (data: unknown): data is InputTask => {
  const validation = taskSchema.validate(data, {});
  if (validation.error != null) {
    // TODO[refactor]: Not a HTTP error at this point
    throw new HTTPError(`Body is not valid: ${validation.error.message}`, StatusCodes.BAD_REQUEST);
  }
  return true;
};

/**
 * Gett all tasks in DB
 *
 * @param opts Requests options
 * @param institution The institution of the task
 *
 * @returns Tasks list
 */
// TODO[feat]: Custom sort
export const getAllTasks = async <Keys extends Array<keyof Task>>(
  opts?: { count: number, previous?: Task['id'], select?: Keys },
  institution?: Task['institution'],
): Promise<Task[]> => {
  try {
    const select = opts?.select && opts.select.reduce<Prisma.TaskSelect>(
      (prev, key) => ({ ...prev, [key]: true }),
      {},
    );

    await prisma.$connect();

    const tasks = await prisma.task.findMany({
      take: opts?.count,
      skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
      cursor: opts?.previous ? { id: opts.previous } : undefined,
      select,
      where: institution ? { institution } : undefined,
      orderBy: {
        createdAt: 'asc',
      },
    }) as Task[]; // FIXME: Prisma bug ?

    await prisma.$disconnect();
    return tasks;
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      logger.error(error.message.trim());
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
 * @param institution The institution of the task
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
      history: true,
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
 * @param institution The institution of the task
 *
 * @returns The created task
 */
export const createTask = async (data: unknown, creator: string, institution: Task['institution']): Promise<Task> => {
  // Validate body
  if (!isValidTask(data)) {
    // TODO[refactor]: Not a HTTP error at this point
    throw new HTTPError('Body is not valid', StatusCodes.BAD_REQUEST);
  }

  await prisma.$connect();

  const task = await prisma.task.create({
    data: {
      ...data,
      institution,
      history: {
        create: { type: 'creation', message: `Tâche créée par ${creator}` },
      },
    },
  });

  await prisma.$disconnect();
  return task;
};

/**
 * Edit task in DB
 *
 * @param data The input data
 * @param id The id of the task
 * @param editor The user editing the task
 * @param institution The institution of the task
 *
 * @returns The edited task
 */
export const editTaskById = async (data: unknown, id: Task['id'], editor: string, institution?: Task['institution']): Promise<Task | null> => {
  // Validate body
  if (!isValidTask(data)) {
    // TODO[refactor]: Not a HTTP error at this point
    throw new HTTPError('Body is not valid', StatusCodes.BAD_REQUEST);
  }

  // Check if task exist
  const task = await getTaskById(id, institution);
  if (!task) {
    return null;
  }

  await prisma.$connect();

  const editedTask = await prisma.task.update({
    data: {
      ...data,
      history: {
        create: { type: 'edition', message: `Tâche éditée par ${editor}`, date: formatISO(new Date()) },
      },
    },
    where: {
      id,
    },
    include: {
      history: true,
    },
  });

  await prisma.$disconnect();
  return editedTask;
};

/**
 * Delete specific task in DB
 *
 * @param id The id of the task
 * @param institution The institution of the task
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
      history: true,
    },
  });

  await prisma.$disconnect();
  return deletedTask;
};

/**
 * Add an entry to task history
 *
 * @param id The id of the task
 * @param entry The new entry in history
 *
 * @returns The task
 */
export const addTaskHistory = async (id: Task['id'], entry: Pick<History, 'type' | 'message'>): Promise<Task | null> => {
  await prisma.$connect();

  // Check if task exist
  const task = await getTaskById(id);
  if (!task) {
    return null;
  }

  const editedTask = await prisma.task.update({
    data: {
      history: {
        create: { ...entry, date: formatISO(new Date()) },
      },
    },
    where: {
      id,
    },
    include: {
      history: true,
    },
  });

  await prisma.$disconnect();
  return editedTask;
};

/**
 * Silently (without writing in history) edit a specific task. Do not use in HTTP methods.
 *
 * @param id The id of the task
 * @param data The input data
 *
 * @returns The edited task, or null if task doesn't exist
 */
export const slientEditTaskById = async (id: Task['id'], data: Partial<InputTask & Pick<Task, 'lastRun'>>): Promise<Task | null> => {
  // Check if task exist
  const task = await getTaskById(id);
  if (!task) {
    return null;
  }

  await prisma.$connect();

  const editedTask = await prisma.task.update({
    data,
    where: {
      id,
    },
  });

  await prisma.$disconnect();
  return editedTask;
};
