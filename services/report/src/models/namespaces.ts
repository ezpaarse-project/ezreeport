import { isEqual } from 'lodash';

import { parseBulkResults, type BulkResult } from '~/lib/utils';
import { appLogger } from '~/lib/logger';
import prisma from '~/lib/prisma';
import type {
  Namespace,
  Prisma,
  Membership,
} from '~/lib/prisma';
import { Type, type Static, Value } from '~/lib/typebox';

import {
  MembershipBody,
  upsertBulkMembership,
  deleteBulkMembership,
} from './memberships';
import { TaskList } from './tasks';
import { buildPagination } from './pagination';

type InputNamespace = Pick<Prisma.NamespaceCreateInput, 'name' | 'fetchLogin' | 'fetchOptions' | 'logoId'>;

type FullNamespace = Namespace & {
  memberships: Omit<Membership, 'namespaceId'>[],
  tasks: Omit<TaskList[number], 'tags' | '_count' | 'namespaceId'>[],
};

const {
  PaginationQuery: NamespacePaginationQuery,
  buildPrismaArgs,
} = buildPagination({
  model: {} as Record<keyof Namespace, unknown>,

  primaryKey: 'id',
  previousType: Type.String(),
  sortKeys: [
    'name',
    'createdAt',
    'updatedAt',
  ],
});

export { NamespacePaginationQuery };
export type NamespacePaginationQueryType = Static<typeof NamespacePaginationQuery>;

export const NamespaceBody = Type.Object({
  name: Type.String(),

  fetchLogin: Type.Object({
    elastic: Type.Object({
      username: Type.String(),
    }),
  }),

  fetchOptions: Type.Object({
    elastic: Type.Object({}),
  }),

  logoId: Type.Optional(
    Type.String(),
  ),
});

export type NamespaceBodyType = Static<typeof NamespaceBody>;

const prismaNamespaceInclude = {
  memberships: {
    select: {
      access: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  tasks: {
    select: {
      id: true,
      name: true,
      recurrence: true,
      nextRun: true,
      lastRun: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,

      extendedId: true,
      lastExtended: true,
    },
  },
} satisfies Prisma.NamespaceInclude;

/**
 * Get count of namespaces entries in DB
 *
 * @returns The entries count
 */
export const getCountNamespaces = async (): Promise<number> => prisma.namespace.count();

/**
 * Get all namespace entries in DB
 *
 * @param opts Requests options
 *
 * @returns Namespace entries list
 */
export const getAllNamespaces = (
  opts?: NamespacePaginationQueryType,
) => prisma.namespace.findMany({
  ...buildPrismaArgs(opts || {}),
  select: {
    id: true,
    name: true,
    logoId: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        tasks: true,
        memberships: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

/**
 * Get specific namespace in DB
 *
 * @param id The id of the namespace
 *
 * @returns Namespace
 */
export const getNamespaceById = async (id: Namespace['id']) => prisma.namespace.findFirst({
  where: {
    id,
  },
  include: prismaNamespaceInclude,
}) as Promise<FullNamespace | null>;

/**
 * Get reporting user from given namespace id
 *
 * @param namespaceId The id of the namespace
 *
 * @returns The Elastic username
 */
export const getReportingUserFromNamespace = async (namespaceId: string) => {
  const namespace = await getNamespaceById(namespaceId);
  const casted = Value.Cast(NamespaceBody, namespace);

  return casted.fetchLogin.elastic.username;
};

/**
 * Create namespace in DB
 *
 * @param id The namespace id
 * @param data The input data
 *
 * @returns The created namespace
 */
export const createNamespace = async (id: string, data: InputNamespace): Promise<FullNamespace> => {
  const namespace = await prisma.namespace.create({
    data: {
      id,
      ...data,
    },
    include: prismaNamespaceInclude,
  });

  appLogger.verbose(`[models] Namespace "${id}" created`);
  return namespace;
};

/**
 * Delete specific namespace in DB
 *
 * @param id The id of the namespace
 *
 * @returns The edited namespace
 */
export const deleteNamespaceById = async (id: Namespace['id']): Promise<FullNamespace | null> => {
  // Check if namespace exist
  const existingNamespace = await getNamespaceById(id);
  if (!existingNamespace) {
    return null;
  }

  const namespace = await prisma.namespace.delete({
    where: {
      id,
    },
    include: prismaNamespaceInclude,
  });

  appLogger.verbose(`[models] Namespace "${id}" deleted`);
  return namespace;
};

/**
 * Edit specific namespace in DB
 *
 * @param id The id of the namespace
 * @param data The input data
 *
 * @returns The edited namespace
 */
export const editNamespaceById = (id: Namespace['id'], data: InputNamespace): Promise<FullNamespace | null> => {
  const namespace = prisma.namespace.update({
    where: {
      id,
    },
    data,
    include: prismaNamespaceInclude,
  });

  appLogger.verbose(`[models] Namespace "${id}" updated`);
  return namespace;
};

export const BulkNamespace = Type.Intersect([
  NamespaceBody,

  Type.Object({
    id: Type.String(),

    members: Type.Array(
      Type.Intersect([
        MembershipBody,

        Type.Object({
          username: Type.String(),
        }),
      ]),
    ),
  }),
]);

export type BulkNamespaceType = Static<typeof BulkNamespace>;

/**
 * Checks if 2 namespace are the same
 *
 * @param current The current state
 * @param input The new state
 *
 * @returns If there's change between states
 */
const hasNamespaceChanged = (current: Namespace, input: InputNamespace): boolean => (
  input.name !== current.name
    || input.logoId !== (current.logoId ?? undefined)
    || !isEqual(input.fetchLogin, current.fetchLogin)
    || !isEqual(input.fetchOptions, current.fetchOptions)
);

/**
 * Update or create a namespace part of bulk
 *
 * @param tx The transaction with DB
 * @param param1 The namespace
 *
 * @returns The operation type (created, updated or none) and the result
 */
const upsertBulkNamespace = async (
  tx: Prisma.TransactionClient,
  { id, members: _, ...inputNamespace }: BulkNamespaceType,
): Promise<BulkResult<Namespace>> => {
  const existingNamespace = await tx.namespace.findUnique({ where: { id } });

  if (!existingNamespace) {
    const data = await tx.namespace.create({ data: { ...inputNamespace, id } });

    appLogger.verbose(`[models] Namespace "${id}" will be created via bulk operation`);
    // If namespace doesn't already exist, create it
    return {
      type: 'created',
      data,
    };
  }

  if (hasNamespaceChanged(existingNamespace, inputNamespace)) {
    const data = await tx.namespace.update({
      where: { id },
      data: inputNamespace,
    });

    appLogger.verbose(`[models] Namespace "${id}" will be updated via bulk operation`);
    // If namespace already exist and changed, update it
    return {
      type: 'updated',
      data,
    };
  }

  return { type: 'none' };
};

/**
 * Delete namespace (not) part of bulk
 *
 * @param tx The transaction with the DB
 * @param param1 The namespace
 *
 * @returns The operation type (created, updated or none) and the result
 */
const deleteBulkNamespace = async (
  tx: Prisma.TransactionClient,
  { id }: Namespace,
): Promise<BulkResult<Namespace>> => {
  const data = await tx.namespace.delete({ where: { id } });

  appLogger.verbose(`[models] Namespace "${id}" will be deleted`);
  return {
    type: 'deleted',
    data,
  };
};

/**
 * Replace many namespace
 *
 * @param data The namespaces with or without members
 *
 * @returns The results
 */
export const replaceManyNamespaces = async (
  data: BulkNamespaceType[],
): Promise<{
  namespaces: BulkResult<Namespace>[],
  members: BulkResult<Membership>[]
}> => {
  const dataWithMembers = data.filter(({ members }) => !!members);
  // Compute which members we will not delete for each namespace
  const membersUsernamesPerNamespace = new Map<string, string[]>(
    dataWithMembers.map(
      ({ id, members }) => ([
        id,
        (members ?? []).map(({ username }) => username),
      ]),
    ),
  );

  const namespacesToDelete = await prisma.namespace.findMany({
    where: {
      id: { notIn: data.map(({ id }) => id) },
    },
  });

  return prisma.$transaction(async (tx) => {
    const namespacesSettled = await Promise.allSettled([
      ...data.map(async (n) => upsertBulkNamespace(tx, n)),

      ...namespacesToDelete.map((n) => deleteBulkNamespace(tx, n)),
    ]);

    // Members changes
    const membersPromises: Promise<BulkResult<Membership>>[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const { members, id: namespaceId } of dataWithMembers) {
      // eslint-disable-next-line no-restricted-syntax
      for (const member of (members ?? [])) {
        membersPromises.push(
          upsertBulkMembership(tx, namespaceId, member.username, member),
        );
      }

      // eslint-disable-next-line no-await-in-loop
      const membersToDelete = await tx.membership.findMany({
        where: {
          AND: {
            namespaceId,
            username: { notIn: membersUsernamesPerNamespace.get(namespaceId) },
          },
        },
      });
      membersPromises.push(
        ...membersToDelete.map((m) => deleteBulkMembership(tx, namespaceId, m.username)),
      );
    }
    const membersSettled = await Promise.allSettled(membersPromises);

    return {
      namespaces: parseBulkResults(namespacesSettled),
      members: parseBulkResults(membersSettled),
    };
  });
};
