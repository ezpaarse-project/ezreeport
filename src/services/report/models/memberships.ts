import Joi from 'joi';
import { appLogger } from '~/lib/logger';
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
export const isValidMembership = (data: unknown): data is InputMembership => {
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

/**
 * Creates a membership between a user and a namespace
 *
 * @param username The username of the user
 * @param namespaceId The id of the namespace
 * @param data The membership data
 *
 * @returns The membership
 */
export const addUserToNamespace = async (
  username: User['username'],
  namespaceId: Namespace['id'],
  data: InputMembership,
) => {
  const membership = await prisma.membership.create({
    data: {
      ...data,
      username,
      namespaceId,
    },
  });

  appLogger.verbose(`[models] Membership between user "${username}" and namespace "${namespaceId}" created`);
  return membership;
};

/**
 * Updates a membership between a user and a namespace
 *
 * @param username The username of the user
 * @param namespaceId The id of the namespace
 * @param data The membership data
 *
 * @returns The membership
 */
export const updateUserOfNamespace = async (
  username: User['username'],
  namespaceId: Namespace['id'],
  data: InputMembership,
) => {
  const membership = await prisma.membership.update({
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

  appLogger.verbose(`[models] Membership between user "${username}" and namespace "${namespaceId}" updated`);
  return membership;
};

/**
 * Remove a membership between a user and a namespace
 *
 * @param username The username of the user
 * @param namespaceId The id of the namespace
 *
 * @returns The membership
 */
export const removeUserFromNamespace = async (
  username: User['username'],
  namespaceId: Namespace['id'],
) => {
  const membership = await prisma.membership.delete({
    where: {
      username_namespaceId: {
        username,
        namespaceId,
      },
    },
  });

  appLogger.verbose(`[models] Membership between user "${username}" and namespace "${namespaceId}" deleted`);
  return membership;
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
    const data = await tx.membership.create({ data: { ...membership, username, namespaceId } });

    appLogger.verbose(`[models] Membership between user "${username}" and namespace "${namespaceId}" will be created via bulk operation`);
    // If namespace doesn't already exist, create it
    return {
      type: 'created',
      data,
    };
  } if (hasMembershipChanged(existingMembership, membership)) {
    const data = await tx.membership.update({
      where: {
        username_namespaceId: { username, namespaceId },
      },
      data: { ...membership, username, namespaceId },
    });

    appLogger.verbose(`[models] Membership between user "${username}" and namespace "${namespaceId}" will be updated via bulk operation`);
    // If namespace already exist, update it
    return {
      type: 'updated',
      data,
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
): Promise<BulkResult<Membership>> => {
  const data = await tx.membership.delete({
    where: { username_namespaceId: { username, namespaceId } },
  });

  appLogger.verbose(`[models] Membership between user "${username}" and namespace "${namespaceId}" will be deleted via bulk operation`);
  return {
    type: 'deleted',
    data,
  };
};
