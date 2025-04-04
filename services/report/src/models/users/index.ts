import { ensureSchema } from '@ezreeport/models/lib/zod';
import type { Prisma } from '@ezreeport/database/types';
import prisma from '~/lib/prisma';
import { appLogger } from '~/lib/logger';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';

import { generateToken } from '~/models/access';
import { replaceMemberships } from '~/models/memberships';
import type { BulkMembershipType } from '~/models/memberships/types';

import {
  User,
  type UserType,
  type InputUserType,
  type UserQueryFiltersType,
  type BulkUserType,
} from './types';

const logger = appLogger.child({ scope: 'models', model: 'users' });

function applyFilters(filters: UserQueryFiltersType) {
  const where: Prisma.UserWhereInput = {};

  if (filters?.query) {
    where.username = { contains: filters.query, mode: 'insensitive' as Prisma.QueryMode };
  }

  return where;
}

/**
 * Get all users
 *
 * @param filters Filters options
 * @param pagination Pagination options
 *
 * @returns All users following pagination
 */
export async function getAllUsers(
  filters?: UserQueryFiltersType,
  pagination?: PaginationType,
): Promise<UserType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.UserFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Fetch data
  const data = await prisma.user.findMany(prismaQuery);

  // Ensure data
  const users = await Promise.all(
    data.map((user) => ensureSchema(User, user, (u) => `Failed to parse user ${u.username}`)),
  );
  return users;
}

/**
 * Get one user
 *
 * @param username The user's username
 *
 * @returns The found user, or `null` if not found
 */
export async function getUser(username: string): Promise<UserType | null> {
  const data = await prisma.user.findUnique({ where: { username } });

  return data && ensureSchema(User, data);
}

/**
 * Create a new user, throws if constraint is broken
 *
 * @param data The user's data
 *
 * @returns The created user
 */
export async function createUser(data: InputUserType & { username: string }): Promise<UserType> {
  const user = await prisma.user.create({
    data: {
      ...data,
      token: await generateToken(),
    },
  });

  logger.debug({
    id: user.username,
    action: 'Created',
    msg: 'Created',
  });

  return ensureSchema(User, user);
}

/**
 * Edit a user, throws if user doesn't exists or if constraint is broken
 *
 * @param username User's username
 * @param data The user's data
 *
 * @returns The edited user
 */
export async function editUser(username: string, data: InputUserType): Promise<UserType> {
  const user = await prisma.user.update({
    where: {
      username,
    },
    data,
  });

  logger.debug({
    id: user.username,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(User, user);
}

/**
 * Delete a user, throws if user doesn't exists
 *
 * @param username User's username
 *
 * @returns The deleted user
 */
export async function deleteUser(username: string): Promise<UserType> {
  const user = await prisma.user.delete({ where: { username } });

  return ensureSchema(User, user);
}

/**
 * Get count of users
 *
 * @param filters Filters options
 *
 * @returns Count of users
 */
export async function countUsers(filters?: UserQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.UserCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  const count = await prisma.user.count({
    ...prismaQuery,
    select: { username: true },
  });

  return count.username;
}

/**
 * Get if user exists
 *
 * @param username The user's username
 *
 * @returns True if user exists
 */
export async function doesUserExist(username: string): Promise<boolean> {
  const count = await prisma.user.count({ where: { username }, select: { username: true } });

  return count.username > 0;
}

/**
 * Replace many users
 *
 * @param data The users with or without memberships
 *
 * @returns Summary of operations
 */
export async function replaceUsers(data: BulkUserType[]) {
  const memberships: BulkMembershipType[] = data.flatMap(
    (u) => (u.memberships ?? []).map((m) => ({ ...m, username: u.username })),
  );
  const willReplaceMemberships = memberships.length > 0;

  const dataPerUsername = new Map(data.map((u) => [u.username, u]));

  // Prepare operations
  const current = await prisma.user.findMany();

  const toDelete = current.filter((u) => !dataPerUsername.has(u.username));

  const toEdit = current.filter((u) => dataPerUsername.has(u.username));
  const editData = toEdit.map((u) => ({
    // toEdit is made of dataPerUsername so we can assume it is safe
    ...dataPerUsername.get(u.username)!,
    // Disconnect memberships, as we will replace them later
    memberships: willReplaceMemberships ? { deleteMany: {} } : undefined,
  } satisfies Prisma.UserUpdateInput));

  const toEditIds = new Set(toEdit.map((u) => u.username));
  const toCreate = data.filter((u) => !toEditIds.has(u.username));
  const createData = await Promise.all(toCreate.map(async (u) => ({
    // toCreate is made of toEdit so we can assume it is safe
    ...dataPerUsername.get(u.username)!,
    // Create token for each one
    token: await generateToken(),
    // Don't create memberships, as we will replace them later
    memberships: undefined,
  } satisfies Prisma.UserCreateInput)));

  // Executing operations
  const [
    deleted,
    updated,
    created,
  ] = await prisma.$transaction(async (tx) => {
    const deleteOperations = prisma.user.deleteMany({
      where: { username: { in: toDelete.map((u) => u.username) } },
    });

    const updateOperations = Promise.all(editData.map(
      (newData) => tx.user.update({ where: { username: newData.username }, data: newData }),
    ));

    const createOperations = prisma.user.createMany({ data: createData });

    return Promise.all([
      deleteOperations,
      updateOperations,
      createOperations,
    ]);
  });

  logger.debug({
    deleted: deleted.count,
    updated: updated.length,
    created: created.count,
    action: 'Replaced',
    msg: 'Replaced',
  });

  let membershipResult;
  if (willReplaceMemberships) {
    membershipResult = await replaceMemberships(memberships);
  }

  return {
    users: {
      deleted: deleted.count,
      updated: updated.length,
      created: created.count,
    },
    ...membershipResult,
  };
}
