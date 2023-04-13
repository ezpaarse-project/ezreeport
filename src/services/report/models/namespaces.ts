import Joi from 'joi';
import prisma from '~/lib/prisma';
import fetchers from '~/generators/fetchers';
import type {
  Namespace, Prisma, Membership, Task
} from '~/lib/prisma';
import { ArgumentError } from '~/types/errors';

type InputNamespace = Pick<Prisma.NamespaceCreateInput, 'name' | 'fetchLogin' | 'fetchOptions' | 'logoId'>;

type FullNamespace = Namespace & {
  memberships: Membership[],
  tasks: Task[],
};

interface NamespaceOptions {
  fetchLogin: {
    'elastic'?: { username: string }
  },
  fetchOptions: {
    'elastic'?: { indexPrefix?: string }
  },
}

export type TypedNamespace = Omit<Namespace, 'fetchLogin' | 'fetchOptions'> & NamespaceOptions;

/**
 * Joi schema
 */
const namespaceSchema = Joi.object<Prisma.NamespaceCreateInput>({
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
  logoId: Joi.string(),
});

/**
 * Check if input data is a namespace
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
const isValidNamespace = (data: unknown): data is InputNamespace => {
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
  },
  orderBy: {
    createdAt: 'desc',
  },
});

/**
 * Get namespace entries in DB, filtered by given ids
 *
 * @param ids The namespaces' ids
 *
 * @returns The namespaces filtered by given ids
 */
export const getNamespacesByIds = (ids: Namespace['id'][]) => prisma.namespace.findMany({
  where: {
    id: {
      in: ids,
    },
  },
  select: {
    id: true,
    name: true,
    logoId: true,
    createdAt: true,
    updatedAt: true,
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
    memberships: true,
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
export const createNamespace = (id: string, data: unknown): Promise<FullNamespace> => {
  // Validate body
  if (!isValidNamespace(data)) {
    // As validation throws an error, this line shouldn't be called
    return Promise.resolve({} as FullNamespace);
  }

  return prisma.namespace.create({
    data: {
      id,
      ...data,
    },
    include: {
      memberships: true,
      tasks: true,
    },
  });
};

/**
 * Delete specific namespace in DB
 *
 * @param id The id of the namespace
 *
 * @returns The edited namespace
 */
export const deleteNamespaceById = async (id: Namespace['id']) => {
  // Check if namespace exist
  const namespace = await getNamespaceById(id);
  if (!namespace) {
    return null;
  }

  return prisma.namespace.delete({
    where: {
      id,
    },
    include: {
      memberships: true,
      tasks: true,
    },
  }) as Promise<FullNamespace | null>;
};

/**
 * Edit specific namespace in DB
 *
 * @param id The id of the namespace
 * @param data The input data
 *
 * @returns The edited namespace
 */
export const editNamespaceById = (id: Namespace['id'], data: unknown): Promise<FullNamespace | null> => {
  // Validate body
  if (!isValidNamespace(data)) {
    // As validation throws an error, this line shouldn't be called
    return Promise.resolve(null);
  }

  return prisma.namespace.update({
    where: {
      id,
    },
    data,
    include: {
      memberships: true,
      tasks: true,
    },
  });
};
