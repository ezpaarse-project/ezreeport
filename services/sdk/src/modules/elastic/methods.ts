import { client } from '~/lib/fetch';
import type { ApiResponse } from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import { Namespace } from '~/modules/namespaces/types';

import { Index, Mapping } from './types';

/**
 * List all available indices
 *
 * Providing a query will resolve it
 *
 * @param namespace The concerned namespace. **Needed if not admin**
 *
 * @returns The list of available indices
 */
export async function getAllIndices(
  namespaceOrId?: Namespace | string,
  query?: string,
): Promise<Index[]> {
  const namespaceId = typeof namespaceOrId === 'string' ? namespaceOrId : namespaceOrId?.id;

  const {
    content,
  } = await client.fetch<ApiResponse<Index[]>>('/elastic/indices', {
    query: { query: query || undefined, namespaceId: namespaceId || undefined },
  });

  return content;
}
assignPermission(getAllIndices, 'GET /elastic/indices', true);

/**
 * Get mapping of an specific index
 *
 * @param index The index (can be a wildcard)
 * @param namespace The concerned namespace. **Needed if not admin**
 *
 * @returns The list of available indices
 */

export async function getIndexMapping(
  index: string,
  namespaceOrId?: Namespace | string,
): Promise<Mapping> {
  const namespaceId = typeof namespaceOrId === 'string' ? namespaceOrId : namespaceOrId?.id;

  const {
    content,
  } = await client.fetch<ApiResponse<Mapping>>(`/elastic/indices/${index}`, {
    query: { namespaceId: namespaceId || undefined },
  });

  return content;
}
assignPermission(getIndexMapping, 'GET /elastic/indices/:index', true);
