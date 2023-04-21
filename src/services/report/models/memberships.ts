import Joi from 'joi';
import prisma from '~/lib/prisma';
import {
  Access,
  type Membership,
  type Prisma,
  type User,
  type Namespace
} from '~/lib/prisma';
import type { BulkResult } from '~/lib/utils';
import { ArgumentError } from '~/types/errors';

type InputMembership = Pick<Prisma.MembershipCreateInput, 'access'>;

/**
 * Joi schema
 */
export const membershipSchema = Joi.object<Prisma.MembershipCreateInput>({
  access: Joi.string().valid(...Object.values(Access)).required(),
});

/**
 * Check if input data is a membership
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isValidMembership = (data: unknown): data is InputMembership => {
  const validation = membershipSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

/**
 * Checks if 2 memberships are the same
 *
 * @param current The current state
 * @param input The new state
 *
 * @returns If there's change between states
 */
const hasMembershipChanged = (current: Membership, input: Omit<Membership, 'namespaceId' | 'username' | 'updatedAt' | 'createdAt'>) => (
  input.access !== current.access
);

export const addUserToNamespace = async (username: User['username'], namespaceId: Namespace['id'], data: unknown) => {
  if (!isValidMembership(data)) {
    // As validation throws an error, this line shouldn't be called
    return;
  }

  await prisma.$connect();

  await prisma.membership.create({
    data: {
      ...data,
      username,
      namespaceId,
    },
  });

  await prisma.$disconnect();
};

export const updateUserOfNamespace = async (username: User['username'], namespaceId: Namespace['id'], data: unknown) => {
  if (!isValidMembership(data)) {
    // As validation throws an error, this line shouldn't be called
    return;
  }

  await prisma.$connect();

  await prisma.membership.update({
    where: {
      username_namespaceId: {
        username,
        namespaceId,
      },
    },
    data: {
      ...data,
      username,
      namespaceId,
    },
  });

  await prisma.$disconnect();
};

export const removeUserFromNamespace = async (username: User['username'], namespaceId: Namespace['id']) => {
  await prisma.$connect();

  await prisma.membership.delete({
    where: {
      username_namespaceId: {
        username,
        namespaceId,
      },
    },
  });

  await prisma.$disconnect();
};

/**
* Update or create a memberships part of bulk of namespace
*
* @param tx The transaction with the DB
* @param namespaceId Namespace id linked to the membership
* @param username The username linked to the membership
* @param membership The membership
*
* @returns  The operation type (created, updated or none) and the result
*/
export const upsertBulkMembership = async (
  tx: Prisma.TransactionClient,
  namespaceId: string,
  username: string,
  membership: Omit<Membership, 'namespaceId' | 'username' | 'updatedAt' | 'createdAt'>,
): Promise<BulkResult<Membership>> => {
  const existingMembership = await tx.membership.findUnique({
    where: {
      username_namespaceId: { username, namespaceId },
    },
  });

  if (!existingMembership) {
    // If namespace doesn't already exist, create it
    return {
      type: 'created',
      data: await tx.membership.create({ data: { ...membership, username, namespaceId } }),
    };
  } if (hasMembershipChanged(existingMembership, membership)) {
    // If namespace already exist, update it
    return {
      type: 'updated',
      data: await tx.membership.update({
        where: {
          username_namespaceId: { username, namespaceId },
        },
        data: { ...membership, username, namespaceId },
      }),
    };
  }

  return { type: 'none' };
};

/**
* Delete membership (not) part of bulk of namespaces
*
* @param tx The transaction with the DB
* @param namespaceId Namespace id linked to the membership
* @param username The username linked to the membership
*
* @returns The operation type (created, updated or none) and the result
*/
export const deleteBulkMembership = async (
  tx: Prisma.TransactionClient,
  namespaceId: string,
  username: string,
): Promise<BulkResult<Membership>> => ({
  type: 'deleted',
  data: await tx.membership.delete({
    where: { username_namespaceId: { username, namespaceId } },
  }),
});
