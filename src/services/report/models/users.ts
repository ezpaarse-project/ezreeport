import Joi from 'joi';
import { randomBytes } from 'node:crypto';
import prisma from '~/lib/prisma';
import type {
  User, Prisma, Membership, Namespace
} from '~/lib/prisma';
import { ArgumentError } from '~/types/errors';

type InputUser = Pick<Prisma.UserCreateInput, 'isAdmin'>;
export type FullUser = User & {
  memberships: (
    Pick<Membership, 'access' | 'createdAt' | 'updatedAt'>
    & { namespace: Pick<Namespace, 'id' | 'name' | 'logoId' | 'createdAt' | 'updatedAt'> }
  )[]
};

/**
 * Joi schema
 */
const userSchema = Joi.object<Prisma.UserCreateInput>({
  isAdmin: Joi.boolean().default(false),
});

/**
 * Check if input data is a user
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isValidUser = (data: unknown): data is InputUser => {
  const validation = userSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

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
      },
    },
  },
};

/**
 * Get count of users entries in DB
 *
 * @returns The entries count
 */
export const getCountUsers = async (): Promise<number> => {
  await prisma.$connect();

  const count = await prisma.user.count();

  await prisma.$disconnect();
  return count;
};

/**
 * Get all user entries in DB
 *
 * @param opts Requests options
 *
 * @returns User entries list
 */
// TODO[feat]: Custom sort
export const getAllUsers = async (
  opts?: {
    count?: number,
    previous?: User['username']
  },
) => prisma.user.findMany({
  take: opts?.count,
  skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
  cursor: opts?.previous ? { username: opts.previous } : undefined,
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
 * Create user in DB
 *
 * @param username The username
 *
 * @returns The created user
 */
export const createUser = async (
  username: string,
  data: unknown,
): Promise<FullUser> => {
  if (!isValidUser(data)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullUser;
  }

  // Generate token
  const token = await new Promise<string>((resolve, reject) => {
    randomBytes(124, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString('base64'));
    });
  });

  return prisma.user.create({
    data: {
      ...data,
      username,
      token,
    },
    include: {
      memberships: prismaMembershipSelect,
    },
  });
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
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }

  return prisma.user.delete({
    where: {
      username,
    },
    include: {
      memberships: prismaMembershipSelect,
    },
  });
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
  data: unknown,
): Promise<FullUser | null> => {
  // Validate body
  if (!isValidUser(data)) {
    // As validation throws an error, this line shouldn't be called
    return null;
  }

  return prisma.user.update({
    where: {
      username,
    },
    data,
    include: {
      memberships: prismaMembershipSelect,
    },
  });
};

/**
 * Edit users
 *
 * @param users List of user and their config
 *
 * @returns List of updated user
 */
export const editUsers = async (users: Array<User>): Promise<Array<FullUser> | null> => {
  const updatedUsers = [];

  const actualUsers = await getAllUsers();

  for (let i = 1; i < users.length; i += 1) {
    const user = users[i];

    // TODO check username and data
    const {
      username,
      data,
    } = user;

    if (!isValidUser(data)) {
      // As validation throws an error, this line shouldn't be called
      return null;
    }

    // if no exist, create
    const userExist = getUserByUsername(user.username);
    if (!userExist) {
      const createdUser = createUser(username, data);
      updatedUsers.push(createdUser);
    }

    // eslint-disable-next-line no-await-in-loop
    const updatedUser = await prisma.user.update({
      where: {
        username,
      },
      data,
      include: {
        memberships: prismaMembershipSelect,
      },
    });

    // TODO filter only updated with change
    updatedUsers.push(updatedUser);
  }

  // if user exist but not anymore, delete it
  for (let i = 1; i < actualUsers.length; i += 1) {
    const oldUser = users[i];

    const isUserNotExistAnymore = users.find((newUser) => newUser.username === oldUser.username);
    if (!isUserNotExistAnymore) {
      // eslint-disable-next-line no-await-in-loop
      const deletedUser = await deleteUserByUsername(oldUser.username);
      updatedUsers.push(deletedUser);
    }
  }
  return updatedUsers;
};
