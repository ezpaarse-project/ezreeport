import { ensureSchema } from '~common/lib/zod';
import prisma from '~/lib/prisma';
import { elasticIndexMapping, elasticListIndices, elasticResolveIndex } from '~/lib/elastic';

import { Namespace } from '~/models/namespaces/types';

import type { IndexType, MappingType } from './types';

/**
 * Get the elastic user for a namespace
 *
 * @param namespaceId The namespace
 *
 * @returns The elastic username
 */
async function getElasticUserForNamespace(namespaceId: string) {
  const namespace = await prisma.namespace.findUniqueOrThrow({
    where: { id: namespaceId },
    select: { fetchLogin: true },
  });
  const fetchOptions = await ensureSchema(Namespace.shape.fetchLogin, namespace.fetchLogin);
  return fetchOptions.elastic.username;
}

/**
 * Get all indices
 *
 * @param namespaceId Restrict to namespace
 * @param query Resolve query
 *
 * @returns The list of indices and aliases
 */
export async function getAllIndices(
  namespaceId?: string,
  query?: string,
): Promise<IndexType[]> {
  let elasticUser: string | undefined;
  if (namespaceId) {
    elasticUser = await getElasticUserForNamespace(namespaceId);
  }

  if (query) {
    return elasticResolveIndex(query, elasticUser);
  }

  return elasticListIndices(elasticUser);
}

/**
 * Get mapping of an specific index
 *
 * @param index The index
 * @param namespaceId Restrict to namespace
 *
 * @returns The mapping
 */
export async function getIndex(
  index: string,
  namespaceId?: string,
): Promise<MappingType> {
  let elasticUser: string | undefined;
  if (namespaceId) {
    elasticUser = await getElasticUserForNamespace(namespaceId);
  }

  return elasticIndexMapping(index, elasticUser);
}
