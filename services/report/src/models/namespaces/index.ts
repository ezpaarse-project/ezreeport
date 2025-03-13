import prisma, { type Prisma } from '~/lib/prisma';
import { appLogger } from '~/lib/logger';
import { ensureSchema } from '~common/lib/zod';

import { buildPaginatedRequest } from '~/models/pagination';
import { PaginationType } from '~/models/pagination/types';

import { replaceMemberships } from '~/models/memberships';
import type { BulkMembershipType } from '~/models/memberships/types';

import {
  Namespace,
  type NamespaceType,
  type NamespaceQueryFiltersType,
  type InputNamespaceType,
  type BulkNamespaceType,
} from './types';

const logger = appLogger.child({ scope: 'models', model: 'namespaces' });

function applyFilters(filters: NamespaceQueryFiltersType) {
  const where: Prisma.NamespaceWhereInput = {};

  if (filters.query) {
    where.name = { contains: filters.query, mode: 'insensitive' as Prisma.QueryMode };
  }

  return where;
}

/**
 * Get all namespaces
 *
 * @param filters Filters options
 * @param pagination Pagination options
 *
 * @returns All namespaces following pagination
 */
export async function getAllNamespaces(
  filters?: NamespaceQueryFiltersType,
  pagination?: PaginationType,
): Promise<NamespaceType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.NamespaceFindManyArgs = buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  // Fetch data
  const data = await prisma.namespace.findMany(prismaQuery);

  // Ensure data
  const namespaces = await Promise.all(
    data.map((namespace) => ensureSchema(Namespace, namespace, (n) => `Failed to parse namespace ${n.id}`)),
  );
  return namespaces;
}

/**
 * Get one namespace
 *
 * @param id The namespace's id
 *
 * @returns The found namespace, or `null` if not found
 */
export async function getNamespace(id: string): Promise<NamespaceType | null> {
  const namespace = await prisma.namespace.findUnique({ where: { id } });

  return namespace && ensureSchema(Namespace, namespace);
}

/**
 * Create a new namespace, throws if constraint is broken
 *
 * @param data The namespace's data
 *
 * @returns The created namespace
 */
export async function createNamespace(
  data: InputNamespaceType & { id: string },
): Promise<NamespaceType> {
  const namespace = await prisma.namespace.create({ data });

  logger.debug({
    id: namespace.id,
    action: 'Created',
    msg: 'Created',
  });

  return ensureSchema(Namespace, namespace);
}

/**
 * Edit a namespace, throws if namespace doesn't exists or if constraint is broken
 *
 * @param id Namespace's id
 * @param data The namespace's data
 *
 * @returns The edited namespace
 */
export async function editNamespace(id: string, data: InputNamespaceType): Promise<NamespaceType> {
  const namespace = await prisma.namespace.update({
    where: {
      id,
    },
    data,
  });

  logger.debug({
    id: namespace.id,
    action: 'Updated',
    msg: 'Updated',
  });

  return ensureSchema(Namespace, namespace);
}

/**
 * Delete a namespace, throws if namespace doesn't exists
 *
 * @param id Namespace's id
 *
 * @returns The deleted namespace
 */
export async function deleteNamespace(id: string): Promise<NamespaceType> {
  const namespace = await prisma.namespace.delete({ where: { id } });

  logger.debug({
    id: namespace.id,
    action: 'Deleted',
    msg: 'Deleted',
  });

  return ensureSchema(Namespace, namespace);
}

/**
 * Get count of namespaces
 *
 * @param filters Filters options
 *
 * @returns Count of namespaces
 */
export async function countNamespaces(filters?: NamespaceQueryFiltersType): Promise<number> {
  const prismaQuery: Prisma.NamespaceCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  const result = await prisma.namespace.count({
    ...prismaQuery,
    select: { id: true },
  });

  return result.id;
}

/**
 * Get if namespace exists
 *
 * @param id The namespace's id
 *
 * @returns True if namespace exists
 */
export async function doesNamespaceExist(id: string): Promise<boolean> {
  const count = await prisma.namespace.count({ where: { id }, select: { id: true } });

  return count.id > 0;
}

/**
 * Replace many namespaces
 *
 * @param data The namespaces with or without members
 *
 * @returns Summary of operations
 */
export async function replaceNamespaces(data: BulkNamespaceType[]) {
  const dataPerId = new Map(data.map((n) => [n.id, n]));

  // Prepare operations
  const current = await prisma.namespace.findMany();

  const toDelete = current.filter((n) => !dataPerId.has(n.id));

  const toEdit = current.filter((n) => dataPerId.has(n.id));
  const editData = toEdit.map((n) => ({
    // toEdit is made of dataPerId so we can assume it is safe
    ...dataPerId.get(n.id)!,
    // Skip memberships, we will replace them later
    memberships: undefined,
  } satisfies Prisma.NamespaceUpdateInput));

  const toEditIds = new Set(toEdit.map((n) => n.id));
  const toCreate = data.filter((n) => !toEditIds.has(n.id));
  const createData = toCreate.map((n) => ({
    // toCreate is made of toEdit so we can assume it is safe
    ...dataPerId.get(n.id)!,
    // Skip memberships, we will replace them later
    memberships: undefined,
  } satisfies Prisma.NamespaceCreateInput));

  // Executing operations
  const [
    deleted,
    updated,
    created,
  ] = await prisma.$transaction(async (tx) => {
    const deleteOperations = prisma.namespace.deleteMany({
      where: { id: { in: toDelete.map((n) => n.id) } },
    });

    const updateOperations = Promise.all(editData.map(
      (newData) => tx.namespace.update({ where: { id: newData.id }, data: newData }),
    ));

    const createOperations = prisma.namespace.createMany({ data: createData });

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
  const memberships: BulkMembershipType[] = data.flatMap(
    (n) => (n.memberships ?? []).map((m) => ({ ...m, namespaceId: n.id })),
  );
  if (memberships.length > 0) {
    membershipResult = await replaceMemberships(memberships);
  }

  return {
    namespaces: {
      deleted: deleted.count,
      updated: updated.length,
      created: created.count,
    },
    ...membershipResult,
  };
}
