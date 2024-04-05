import axios from '../lib/axios';

import type { Namespace } from './namespaces';

/**
 * List all available indices
 *
 * Needs `namespaces[namespaceId].elastic-get-indices` permission
 *
 * @param namespace The concerned namespace. **Needed if not admin**
 *
 * @returns The list of available indices
 */
export const getAllIndices = (
  namespace?: Namespace['id'],
) => axios.$get<string[]>('/elastic/indices', { params: { namespace } });

/**
 * Get mapping of an specific index
 *
 * Needs `namespaces[namespaceId].elastic-get-indices-index` permission
 *
 * @param index The index (can be a wildcard)
 * @param namespace The concerned namespace. **Needed if not admin**
 *
 * @returns The list of available indices
 */
export const getIndexMapping = (
  index: string,
  namespace?: Namespace['id'],
) => axios.$get<Record<string, string>>(`/elastic/indices/${index}`, { params: { namespace } });

/**
 * Resolve index to get list of matched indices
 *
 * Needs `namespaces[namespaceId].elastic-get-indices-_resolve-index` permission
 *
 * @param index The index (can be a wildcard)
 * @param namespace The concerned namespace. **Needed if not admin**
 *
 * @returns The list of available indices
 */
export const resolveIndex = (
  index: string,
  namespace?: Namespace['id'],
) => axios.$get<string[]>(`/elastic/indices/_resolve/${index}`, { params: { namespace } });
