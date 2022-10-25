import type { User } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { HTTPError } from '../types/errors';

// TODO: More checks to make custom errors

/**
 * Joi schema
 */
const userSchema = Joi.object({
  username: Joi.string().required(),
  organisation: Joi.string().required(),
});

/**
 * Check if input data is a user
 *
 * @param data The input data
 * @returns true or throws an error
 *
 * @throw If input data isn't a User
 */
const isValidUser = (data: unknown): data is User => {
  const validation = userSchema.validate(data, {});
  if (validation.error != null) {
    // TODO: Not a HTTP error at this point
    throw new HTTPError(`Body is not valid: ${validation.error.message}`, StatusCodes.BAD_REQUEST);
  }
  return true;
};

/**
 * Get all users in DB
 *
 * @returns All the users
 */
export const getAllUsers = async (
  opts?: { count: number, previous?: User['username'] },
): Promise<User[]> => {
  try {
    await prisma.$connect();

    const users = await prisma.user.findMany({
      take: opts?.count,
      skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
      cursor: opts?.previous ? { username: opts.previous } : undefined,
    });

    await prisma.$disconnect();
    return users;
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
 * Get specific user in DB by username
 *
 * @param username The username
 * @returns The user
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
  await prisma.$connect();

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  await prisma.$disconnect();
  return user;
};

/**
 * Create a user in DB
 *
 * @param data The input data
 * @returns The created user
 */
export const createUser = async (data: unknown): Promise<User> => {
  if (isValidUser(data)) {
    await prisma.$connect();

    const user = await prisma.user.create({ data });

    await prisma.$disconnect();
    return user;
  }
  // TODO: Not a HTTP error at this point
  throw new HTTPError('Body is not valid', StatusCodes.BAD_REQUEST);
};

/**
 * Delete specific user in DB
 *
 * @param username The username
 * @returns The deleted user
 */
export const deleteUserByUsername = async (username: string): Promise<User> => {
  await prisma.$connect();

  const user = await prisma.user.delete({
    where: { username },
  });

  await prisma.$disconnect();
  return user;
};

/**
 * Update a user in DB
 *
 * @param username The username
 * @param data The input data
 * @returns The edited user
 */
export const updateUserByUsername = async (username: string, data: unknown): Promise<User> => {
  if (isValidUser(data)) {
    await prisma.$connect();

    const user = await prisma.user.update({ data, where: { username } });

    await prisma.$disconnect();
    return user;
  }
  // TODO: Not a HTTP error at this point
  throw new HTTPError('Body is not valid', StatusCodes.BAD_REQUEST);
};
