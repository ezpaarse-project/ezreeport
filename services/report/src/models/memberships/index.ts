import type { Prisma } from '@ezreeport/database/types';
import { ensureSchema } from '@ezreeport/models/lib/zod';

import prisma from '~/lib/prisma';
import { appLogger } from '~/lib/logger';

import { buildPaginatedRequest } from '~/models/pagination';
import type { PaginationType } from '~/models/pagination/types';

import {
  Membership,
  type MembershipType,
  type InputMembershipType,
  type BulkMembershipType,
  type BulkMembershipResultType,
} from './types';

type FindOneMembership = {
  username: string;
  namespaceId: string;
};

const logger = appLogger.child({ scope: 'models', model: 'memberships' });

/**
 * Get all memberships
 *
 * @param filters Filters options
 * @param pagination Pagination options
 *
 * @returns All memberships following pagination
 */
export async function getAllMemberships(
  filters?: Partial<FindOneMembership>,
  pagination?: PaginationType
): Promise<MembershipType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.MembershipFindManyArgs =
    buildPaginatedRequest(pagination);
  prismaQuery.where = filters;

  // Fetch data
  const data = await prisma.membership.findMany(prismaQuery);

  // Ensure data
  const memberships = await Promise.all(
    data.map((membership) =>
      ensureSchema(
        Membership,
        membership,
        (ship) =>
          `Failed to parse membership between ${ship.username} and ${ship.namespaceId}`
      )
    )
  );
  return memberships;
}

/**
 * Get one membership
 *
 * @param param0 The membership's username and namespace
 *
 * @returns The found membership, or `null` if not found
 */
export async function getMembership({
  username,
  namespaceId,
}: FindOneMembership): Promise<MembershipType | null> {
  const data = await prisma.membership.findUnique({
    where: { username_namespaceId: { username, namespaceId } },
  });

  return data && ensureSchema(Membership, data);
}

/**
 * Create a new membership, throws if constraint is broken
 *
 * @param data The membership's data
 *
 * @returns The created membership
 */
export async function createMembership(
  data: InputMembershipType & FindOneMembership
): Promise<MembershipType> {
  const membership = await prisma.membership.create({ data });

  logger.debug({
    namespaceId: membership.namespaceId,
    username: membership.username,
    action: 'Created',
    msg: 'Created',
  });

  return ensureSchema(Membership, membership);
}

/**
 * Edit a membership, throws if membership doesn't exists or if constraint is broken
 *
 * @param param0 The membership's username and namespace
 * @param data The membership's data
 *
 * @returns The edited membership
 */
export async function editMembership(
  { username, namespaceId }: FindOneMembership,
  data: InputMembershipType
): Promise<MembershipType> {
  const membership = await prisma.membership.update({
    where: { username_namespaceId: { username, namespaceId } },
    data,
  });

  logger.debug({
    namespaceId: membership.namespaceId,
    username: membership.username,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(Membership, membership);
}

/**
 * Delete a membership, throws if membership doesn't exists
 *
 * @param param0 The membership's username and namespace
 *
 * @returns The deleted membership
 */
export async function deleteMembership({
  username,
  namespaceId,
}: FindOneMembership): Promise<MembershipType> {
  const membership = await prisma.membership.delete({
    where: { username_namespaceId: { username, namespaceId } },
  });

  logger.debug({
    namespaceId: membership.namespaceId,
    username: membership.username,
    action: 'Deleted',
    msg: 'Deleted',
  });

  return ensureSchema(Membership, membership);
}

/**
 * Get count of memberships
 *
 * @param filters Filters options
 *
 * @returns Count of memberships
 */
export async function countMemberships({
  username,
  namespaceId,
}: Partial<FindOneMembership> = {}): Promise<number> {
  const result = await prisma.membership.count({
    where: { namespaceId, username },
    select: { username: true },
  });

  return result.username;
}

/**
 * Get if membership exists
 *
 * @param param0 The membership's username and namespace
 *
 * @returns True if membership exists
 */
export async function doesMembershipExist(
  where: FindOneMembership
): Promise<boolean> {
  const count = await prisma.membership.count({
    where,
    select: { username: true },
  });

  return count.username > 0;
}

/**
 * Shorthand to get a composite id of a membership
 *
 * @param param0 The membership
 *
 * @returns The composite id
 */
const getMembershipId = ({ username, namespaceId }: FindOneMembership) =>
  `${namespaceId}:${username}`;

/**
 * Replace many memberships
 *
 * @param data The memberships
 *
 * @returns Summary of operations
 */
export async function replaceMemberships(
  data: BulkMembershipType[]
): Promise<BulkMembershipResultType> {
  const dataPerId = new Map(
    data.map((membership) => [getMembershipId(membership), membership])
  );

  // Prepare operations
  const current = await prisma.membership.findMany();

  const toDelete = current.filter(
    (membership) => !dataPerId.has(getMembershipId(membership))
  );

  const toEdit = current.filter((membership) =>
    dataPerId.has(getMembershipId(membership))
  );
  // toEdit is made of dataPerId so we can assume it is safe
  const editData = toEdit.map(
    (membership) => dataPerId.get(getMembershipId(membership))!
  );

  const toEditIds = new Set(
    toEdit.map((membership) => getMembershipId(membership))
  );
  const toCreate = data.filter(
    (membership) => !toEditIds.has(getMembershipId(membership))
  );
  // toCreate is made of toEdit so we can assume it is safe
  const createData = toCreate.map(
    (membership) => dataPerId.get(getMembershipId(membership))!
  );

  // Executing operations
  const [deleted, updated, created] = await prisma.$transaction((tx) => {
    const deleteOperations = Promise.all(
      toDelete.map((membership) =>
        tx.membership.delete({
          where: {
            username_namespaceId: {
              username: membership.username,
              namespaceId: membership.namespaceId,
            },
          },
        })
      )
    );

    const updateOperations = Promise.all(
      editData.map((newData) =>
        tx.membership.update({
          where: {
            username_namespaceId: {
              username: newData.username,
              namespaceId: newData.namespaceId,
            },
          },
          data: newData,
        })
      )
    );

    const createOperations = prisma.membership.createMany({ data: createData });

    return Promise.all([deleteOperations, updateOperations, createOperations]);
  });

  logger.debug({
    deleted: deleted.length,
    updated: updated.length,
    created: created.count,
    action: 'Replaced',
    msg: 'Replaced',
  });

  return {
    memberships: {
      deleted: deleted.length,
      updated: updated.length,
      created: created.count,
    },
  };
}
