import Joi from 'joi';
import { isEqual } from 'lodash';

import fetchers from '~/generators/fetchers';

import { parseBulkResults, type BulkResult } from '~/lib/utils';
import { appLogger } from '~/lib/logger';
import prisma from '~/lib/prisma';
import type {
  Namespace,
  Prisma,
  Membership,
  Task,
} from '~/lib/prisma';

import { ArgumentError } from '~/types/errors';

import {
  membershipSchema,
  upsertBulkMembership,
  deleteBulkMembership,
} from './memberships';

type InputNamespace = Pick<Prisma.NamespaceCreateInput, 'name' | 'fetchLogin' | 'fetchOptions' | 'logoId'>;

type FullNamespace = Namespace & {
  memberships: Omit<Membership, 'namespaceId'>[],
  tasks: Task[],
};

interface NamespaceOptions {
  fetchLogin: {
    'elastic'?: { username: string }
  },
  fetchOptions: {
    'elastic'?: {
      /**
       * @deprecated Use `index` in tasks instead
       */
      indexPrefix?: string
    }
  },
}

export type TypedNamespace = Omit<Namespace, 'fetchLogin' | 'fetchOptions'> & NamespaceOptions;

/**
 * Joi schema
 */
const namespaceSchema = Joi.object<InputNamespace>({
  name: Joi.string().required(),
  fetchLogin: Joi
    .object(
      // Object like { elastic: { user: 'foobar' } }
      Object.fromEntries(
        Object.keys(fetchers).map((key) => [key, Joi.object()]),
      ),
    )
    .required(),
  fetchOptions: Joi
    .object(
      // Object like { elastic: { indexPrefix: {} } }
      Object.fromEntries(
        Object.keys(fetchers).map((key) => [key, Joi.object()]),
      ),
    )
    .required(),
  logoId: Joi.string().allow(null),
});

/**
 * Check if input data is a namespace
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isValidNamespace = (data: unknown): data is InputNamespace => {
  const validation = namespaceSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

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
// TODO[feat]: Custom sort
export const getAllNamespaces = async (
  opts?: {
    count?: number,
    previous?: Namespace['id']
  },
) => prisma.namespace.findMany({
  take: opts?.count,
  skip: opts?.previous ? 1 : undefined, // skip the cursor if needed
  cursor: opts?.previous ? { id: opts.previous } : undefined,
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
  include: {
    memberships: {
      select: {
        access: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    tasks: true,
  },
}) as Promise<FullNamespace | null>;

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
    include: {
      memberships: {
        select: {
          access: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      tasks: true,
    },
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
    include: {
      memberships: {
        select: {
          access: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      tasks: true,
    },
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
    include: {
      memberships: {
        select: {
          access: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      tasks: true,
    },
  });

  appLogger.verbose(`[models] Namespace "${id}" updated`);
  return namespace;
};

interface BulkNamespace extends InputNamespace {
  id: Namespace['id'],
  members?: Omit<Membership, 'namespaceId'>[],
}

const bulkNamespaceSchema = Joi.array<BulkNamespace[]>().items(
  namespaceSchema.append({
    id: Joi.string().required(),
    members: Joi.array().items(
      membershipSchema.append({
        username: Joi.string().required(),
      }),
    ),
  }),
);

/**
 * Check if input data is many namespaces
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isValidBulkNamespace = (data: unknown): data is BulkNamespace[] => {
  const validation = bulkNamespaceSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Body is not valid: ${validation.error.message}`);
  }
  return true;
};

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
  { id, members: _, ...inputNamespace }: BulkNamespace,
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
  } if (hasNamespaceChanged(existingNamespace, inputNamespace)) {
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
  data: BulkNamespace[],
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
