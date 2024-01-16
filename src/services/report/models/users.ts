import { randomBytes } from 'node:crypto';

import prisma from '~/lib/prisma';
import type {
  User,
  Prisma,
  Membership,
  Namespace,
} from '~/lib/prisma';
import { BulkResult, parseBulkResults } from '~/lib/utils';
import { appLogger } from '~/lib/logger';
import { Type, type Static } from '~/lib/typebox';

import { upsertBulkMembership, deleteBulkMembership, MembershipBody } from '~/models/memberships';
import { buildPagination } from './pagination';

type InputUser = Pick<Prisma.UserCreateInput, 'isAdmin'>;

type FullUserMembershipNamespace = (
  Pick<Namespace, 'id' | 'name' | 'logoId' | 'createdAt' | 'updatedAt'>
  & { _count: { tasks: number } }
);

type FullUserMembership = (
  Pick<Membership, 'access' | 'createdAt' | 'updatedAt'>
  & { namespace: FullUserMembershipNamespace }
);

export type FullUser = User & {
  memberships: FullUserMembership[]
};

export const UserBody = Type.Object({
  isAdmin: Type.Optional(
    Type.Boolean(),
  ),
});

export type UserBodyType = Static<typeof UserBody>;

const {
  PaginationQuery: UserPaginationQuery,
  buildPrismaArgs,
} = buildPagination({
  model: {} as Record<keyof User, unknown>,

  primaryKey: 'username',
  previousType: Type.String(),
  sortKeys: [
    'username',
    'isAdmin',
    'createdAt',
    'updatedAt',
  ],
});

export { UserPaginationQuery };
export type UserPaginationQueryType = Static<typeof UserPaginationQuery>;

const prismaMembershipSelect = {
  select: {
    access: true,
    createdAt: true,
    updatedAt: true,

    namespace: {
      select: {
        id: true,
        name: true,
        logoId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    },
  },
} satisfies Prisma.User$membershipsArgs;

/**
 * Get count of users entries in DB
 *
 * @returns The entries count
 */
export const getCountUsers = (): Promise<number> => prisma.user.count();

/**
 * Get all user entries in DB
 *
 * @param opts Requests options
 *
 * @returns User entries list
 */
export const getAllUsers = async (
  opts?: UserPaginationQueryType,
) => prisma.user.findMany({
  ...buildPrismaArgs(opts || {}),
  include: {
    _count: {
      select: {
        memberships: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

/**
 * Get specific user in DB
 *
 * @param username The username of the user
 *
 * @returns User
 */
export const getUserByUsername = async (
  username: User['username'],
): Promise<FullUser | null> => prisma.user.findFirst({
  where: {
    username,
  },
  include: {
    memberships: prismaMembershipSelect,
  },
});

/**
 * Get specific user in DB by token
 *
 * @param username The username of the user
 *
 * @returns User
 */
export const getUserByToken = async (
  token: User['token'],
): Promise<FullUser | null> => prisma.user.findFirst({
  where: {
    token,
  },
  include: {
    memberships: prismaMembershipSelect,
  },
});

/**
 * Generate auth token for user
 *
 * @returns Auth token
 */
const generateToken = async () => new Promise<string>((resolve, reject) => {
  randomBytes(124, (err, buf) => {
    if (err) reject(err);
    resolve(buf.toString('base64'));
  });
});

/**
 * Create user in DB
 *
 * @param username The username
 *
 * @returns The created user
 */
export const createUser = async (
  username: string,
  data: InputUser,
): Promise<FullUser> => {
  // Generate token
  const token = await generateToken();

  const user = prisma.user.create({
    data: {
      ...data,
      username,
      token,
    },
    include: {
      memberships: prismaMembershipSelect,
    },
  });

  appLogger.verbose(`[models] User "${username}" created`);
  return user;
};

/**
 * Delete specific user in DB
 *
 * @param username The username of the user
 *
 * @returns The edited user
 */
export const deleteUserByUsername = async (
  username: User['username'],
): Promise<FullUser | null> => {
  // Check if user exist
  const existingUser = await getUserByUsername(username);
  if (!existingUser) {
    return null;
  }

  const user = await prisma.user.delete({
    where: {
      username,
    },
    include: {
      memberships: prismaMembershipSelect,
    },
  });

  appLogger.verbose(`[models] User "${username}" updated`);
  return user;
};

/**
 * Edit specific user in DB
 *
 * @param username The username of the user
 * @param data The input data
 *
 * @returns The edited user
 */
export const editUserByUsername = async (
  username: User['username'],
  data: InputUser,
): Promise<FullUser | null> => {
  const user = await prisma.user.update({
    where: {
      username,
    },
    data,
    include: {
      memberships: prismaMembershipSelect,
    },
  });

  appLogger.verbose(`[models] User "${username}" deleted`);
  return user;
};

export const BulkUser = Type.Intersect([
  UserBody,

  Type.Object({
    username: Type.String(),

    memberships: Type.Optional(
      Type.Array(
        Type.Intersect([
          MembershipBody,

          Type.Object({
            namespace: Type.String(),
          }),
        ]),
      ),
    ),
  }),
]);

export type BulkUserType = Static<typeof BulkUser>;

/**
 * Checks if 2 users are the same
 *
 * @param current The current state
 * @param input The new state
 *
 * @returns If there's change between states
 */
const hasUserChanged = (current: User, input: InputUser): boolean => (
  input.isAdmin !== current.isAdmin
);

/**
 * Update or create a user part of bulk
 *
 * @param tx The transaction with DB
 * @param param1 The user
 *
 * @returns The operation type (created, updated or none) and the result
 */
const upsertBulkUser = async (
  tx: Prisma.TransactionClient,
  { username, memberships: _, ...inputUser }: BulkUserType,
): Promise<BulkResult<User>> => {
  const existingUser = await tx.user.findUnique({ where: { username } });

  if (!existingUser) {
    // TODO: logger
    const token = await generateToken();
    // If user doesn't already exist, create it
    return {
      type: 'created',
      data: await tx.user.create({ data: { ...inputUser, username, token } }),
    };
  } if (hasUserChanged(existingUser, inputUser)) {
    // TODO: logger
    // If user already exist and changed, update it
    return {
      type: 'updated',
      data: await tx.user.update({
        where: { username },
        data: inputUser,
      }),
    };
  }

  return { type: 'none' };
};

/**
 * Delete user (not) part of bulk
 *
 * @param tx The transaction with the DB
 * @param param1 The user
 *
 * @returns The operation type (created, updated or none) and the result
 */
const deleteBulkUser = async (
  tx: Prisma.TransactionClient,
  { username }: User,
): Promise<BulkResult<User>> => ({
  // TODO: logger
  type: 'deleted',
  data: await tx.user.delete({ where: { username } }),
});

/**
 * Edit users
 *
 * @param users List of user and their config
 *
 * @returns List of updated user
 */
export const replaceManyUsers = async (
  data: BulkUserType[],
): Promise<{
  users: BulkResult<User>[],
  memberships: BulkResult<Membership>[]
}> => {
  const dataWithMemberships = data.filter(({ memberships }) => !!memberships);
  // Compute which memberships we will not delete for each user
  const membershipsIdPerUser = new Map<string, string[]>(
    dataWithMemberships.map(
      ({ username, memberships }) => ([
        username,
        (memberships ?? []).map(({ namespace }) => namespace),
      ]),
    ),
  );

  const usersToDelete = await prisma.user.findMany({
    where: {
      username: { notIn: data.map(({ username }) => username) },
    },
  });

  return prisma.$transaction(async (tx) => {
    const usersSettled = await Promise.allSettled([
      ...data.map((u) => upsertBulkUser(tx, u)),

      ...usersToDelete.map((u) => deleteBulkUser(tx, u)),
    ]);

    const membershipsPromises: Promise<BulkResult<Membership>>[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const { username, memberships } of dataWithMemberships) {
      // eslint-disable-next-line no-restricted-syntax
      for (const membership of (memberships ?? [])) {
        const { namespace, ...d } = membership;
        membershipsPromises.push(
          upsertBulkMembership(tx, namespace, username, d),
        );
      }

      // eslint-disable-next-line no-await-in-loop
      const membershipsToDelete = await tx.membership.findMany({
        where: {
          AND: {
            namespaceId: { notIn: membershipsIdPerUser.get(username) },
            username,
          },
        },
      });
      membershipsPromises.push(
        ...membershipsToDelete.map((m) => deleteBulkMembership(tx, m.namespaceId, username)),
      );
    }
    const membershipsSettled = await Promise.allSettled(membershipsPromises);

    return {
      users: parseBulkResults(usersSettled),
      memberships: parseBulkResults(membershipsSettled),
    };
  });
};
