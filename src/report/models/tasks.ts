import { Recurrence, Task } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { HTTPError } from '../types/errors';
import { findInstitutionByIds } from './institutions';

// TODO: More checks to make custom errors

export type InputTask = Omit<Task, 'institution' | 'history' | 'createdAt' | 'updatedAt' | 'id'> & { layout: object };

/**
 * Joi schema
 */
export const taskSchema = Joi.object<InputTask>({
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
  nextRun: Joi.string().isoDate().required(),
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
    // TODO: Not a HTTP error at this point
    throw new HTTPError(`Body is not valid: ${validation.error.message}`, StatusCodes.BAD_REQUEST);
  }
  return true;
};

/**
 * Gett all tasks in DB
 *
 * TODO: Sort
 *
 * @param opts Pagination options
 * @param institution The institution of the task
 *
 * @returns Tasks list
 */
export const getAllTasks = async (
  opts?: { count: number, previous?: Task['id'] },
  institution?: Task['institution'],
): Promise<Task[]> => {
  try {
    await prisma.$connect();

    const tasks = await prisma.task.findMany({
      take: opts?.count,
      skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
      cursor: opts?.previous ? { id: opts.previous } : undefined,
      where: institution ? { institution } : undefined,
    });

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
  if (isValidTask(data)) {
    await prisma.$connect();

    const task = await prisma.task.create({
      data: {
        ...data,
        institution,
        history: [{ type: 'creation', message: `La tâche a été créée par ${creator}` }],
      },
    });

    await prisma.$disconnect();
    return task;
  }
  throw new HTTPError('Body is not valid', StatusCodes.BAD_REQUEST);
};

/**
 * Get all institutions in DB
 *
 * @param opts Pagination options
 *
 * @returns Institution list
 */
export const getAllInstitutions = async (
  opts?: { count: number, offset: number },
): Promise<Array<{ id: Task['institution'], name: string, logo: string }>> => {
  try {
    await prisma.$connect();

    // Get all institutions id
    const institutionsIds = (await prisma.task.groupBy({
      by: ['institution'],
      orderBy: {
        institution: 'asc',
      },
      where: {
        NOT: {
          institution: '',
        },
      },
      skip: opts?.offset,
      take: opts?.count,
    })).map(({ institution }) => institution);

    await prisma.$disconnect();

    // Enrich data with elastic
    const institutions = await findInstitutionByIds(institutionsIds);

    return institutions
      .filter(({ _source }) => _source != null)
      .map(({ _id: id, _source: { institution } = { institution: { name: '', logoId: '' } } }) => ({
        id: id.toString(),
        name: institution?.name,
        logo: institution?.logoId,
      }));
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      logger.error(error.message.trim());
      throw new Error('An error occured with DB client. See server logs for more information.');
    } else {
      throw error;
    }
  }
};
