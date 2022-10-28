import { Recurrence, type Prisma, type Task } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime';
import { formatISO } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { HTTPError } from '../types/errors';

// TODO[feat]: More checks to make custom errors

export type InputTask = Omit<Task, 'institution' | 'history' | 'createdAt' | 'updatedAt' | 'id'> & { layout: object };

/**
 * Joi schema
 */
export const taskSchema = Joi.object<InputTask>({
  name: Joi.string().trim().required(),
  layout: Joi.object().required(),
  targets: Joi.array().items(Joi.string().trim().email()).required(),
  recurrence: Joi.string().valid(
    Recurrence.DAILY,
    Recurrence.WEEKLY,
    Recurrence.MONTHLY,
    Recurrence.QUARTERLY,
    Recurrence.BIENNIAL,
    Recurrence.YEARLY,
  ).required(),
  nextRun: Joi.string().isoDate().required(), // FIXME: check possible
  enabled: Joi.boolean().default(true),
});

/**
 * Check if input data is a task
 *
 * @param data The input data
 * @returns true or throws an error
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
// TODO[feat]: Sort
export const getAllTasks = async <Keys extends Array<keyof Task>>(
  opts?: { count: number, previous?: Task['id'], select?: Keys },
  institution?: Task['institution'],
): Promise<Task[]> => {
  try {
    const select = opts?.select && opts.select.reduce<Prisma.TaskSelect>(
      (previous, key) => ({ ...previous, [key]: true }),
      {},
    );

    await prisma.$connect();

    const tasks = await prisma.task.findMany({
      take: opts?.count,
      skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
      cursor: opts?.previous ? { id: opts.previous } : undefined,
      select,
      where: institution ? { institution } : undefined,
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
export const getTaskById = async (id: Task['id'], institution?: Task['institution']): Promise<Task | null> => {
  await prisma.$connect();

  const task = await prisma.task.findFirst({
    where: {
      id,
      institution,
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
      history: [{ type: 'creation', message: `Tâche créée par ${creator}`, date: formatISO(new Date()) }],
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
      history: [
        ...(Array.isArray(task.history) ? task.history : []),
        { type: 'edition', message: `Tâche éditée par ${editor}`, date: formatISO(new Date()) },
      ],
    },
    where: {
      id,
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
export const addTaskHistory = async (id: Task['id'], entry: { type: string, message: string }): Promise<Task | null> => {
  // Check if task exist
  const task = await getTaskById(id);
  if (!task) {
    return null;
  }

  await prisma.$connect();

  const editedTask = await prisma.task.update({
    data: {
      history: [
        ...(Array.isArray(task.history) ? task.history : []),
        { ...entry, date: formatISO(new Date()) },
      ],
    },
    where: {
      id,
    },
  });

  await prisma.$disconnect();
  return editedTask;
};
