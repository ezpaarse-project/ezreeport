import type { SearchHit, SearchResponse } from '@elastic/elasticsearch/api/types';
import config from '../lib/config';
import { getElasticClient, READONLY_SUFFIX } from '../lib/elastic';

const TYPE = 'institution' as const;

const { depositorsIndex } = config.get('ezmesure');

type TypedElasticInstitution = {
  type: 'institution';
  institution: ElasticInstitution;
};

/**
 * Remove the readonly suffix from a string
 *
 * @param str The string to trim
 * @returns The trimed string
 */
const trimReadOnlySuffix = (str: string): string => {
  if (typeof str !== 'string') { return ''; }
  if (str.endsWith(READONLY_SUFFIX)) {
    return str.substring(0, str.length - READONLY_SUFFIX.length);
  }
  return str;
};

/**
 * Find institution by creator or role in Elastic
 *
 * @param username The username of the possible creatior
 * @param userRoles The possible roles of the institution
 *
 * @returns The result of search
 */
export const findInstitutionByCreatorOrRole = async (
  username: string,
  userRoles: string[],
): Promise<SearchHit<TypedElasticInstitution>> => {
  const elastic = await getElasticClient();

  // Remove readonly suffix so that we search with the base role
  const roles = Array.isArray(userRoles) ? userRoles.map(trimReadOnlySuffix) : [];

  const result = await elastic.search<SearchResponse<TypedElasticInstitution>>({
    index: depositorsIndex,
    size: 1,
    body: {
      query: {
        bool: {
          should: [
            { bool: { filter: { terms: { [`${TYPE}.role`]: roles } } } },
            { bool: { filter: { term: { [`${TYPE}.creator`]: username } } } },
          ],
        },
      },
    },
  });

  return result.body.hits.hits[0];
};

/**
 * Find institutions by ids in Elastic
 *
 * @param ids Ids of possible institutions
 *
 * @returns  The result of search
 */
export const findInstitutionByIds = async (
  ids: string[],
): Promise<SearchHit<TypedElasticInstitution>[]> => {
  const elastic = await getElasticClient();

  const result = await elastic.search<SearchResponse<TypedElasticInstitution>>({
    index: depositorsIndex,
    body: {
      query: {
        terms: {
          _id: ids,
        },
      },
    },
  });

  return result.body.hits.hits;
};
