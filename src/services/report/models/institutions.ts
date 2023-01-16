import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import type { SearchHit } from '@elastic/elasticsearch/api/types';
import config from '~/lib/config';
import { elasticScroll, elasticSearch, READONLY_SUFFIX } from '~/lib/elastic';
import { NotFoundError } from '~/types/errors';

const TYPE = 'institution' as const;

const { depositorsIndex } = config.get('ezmesure');

export type TypedElasticInstitution = {
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
): Promise<ElasticTypes.SearchHit<TypedElasticInstitution> | undefined> => {
  const { body: { hits: { hits } } } = await elasticSearch<TypedElasticInstitution>({
    index: depositorsIndex,
    size: 1,
    body: {
      query: {
        bool: {
          should: [
            // Remove readonly suffix so that we search with the base role
            { bool: { filter: { terms: { [`${TYPE}.role`]: userRoles.map(trimReadOnlySuffix) } } } },
            { bool: { filter: { term: { [`${TYPE}.creator`]: username } } } },
          ],
        },
      },
    },
  });

  return hits[0];
};

/**
 * Find institutions by ids in Elastic
 *
 * @param ids Ids of possible institutions
 *
 * @returns The result of search
 */
export const findInstitutionByIds = async (
  ids: string[],
): Promise<SearchHit<TypedElasticInstitution>[]> => {
  const { body: { hits: { hits } } } = await elasticSearch<TypedElasticInstitution>({
    index: depositorsIndex,
    body: {
      query: {
        terms: {
          _id: ids,
        },
      },
    },
  });

  return hits;
};

/**
 * Find institution doc or tech contact
 *
 * @param id The id of the institution
 *
 * @returns The doc or tech contact
 */
export const findInstitutionContact = async (
  id: string,
): Promise<SearchHit<Pick<ElasticUser, 'username' | 'email' | 'metadata'>> | undefined> => {
  const [institution] = await findInstitutionByIds([id]);
  if (!institution?._source) {
    throw new NotFoundError("Can't find your institution.");
  }

  const { _source: { institution: { role } } } = institution;
  if (!role) {
    throw new Error('No role found for your institution. It may come for a misconfiguration, please contact developer team to fix that issue.');
  }

  const { body: { hits: { hits } } } = await elasticSearch<Pick<ElasticUser, 'username' | 'email' | 'metadata'>>({
    index: '.security',
    body: {
      size: 1,
      fields: [
        'username',
        'email',
        'metadata',
      ],
      query: {
        bool: {
          filter: [
            { term: { type: 'user' } },
            { term: { enabled: true } },
            { terms: { roles: [role, role + READONLY_SUFFIX] } },
            { terms: { roles: ['doc_contact', 'tech_contact'] } },
          ],
        },
      },
    },
  });

  return hits[0];
};

/**
 * Find all available institutions
 *
 * @returns The result of search
 */
export const findAllInstitutions = async (): Promise<SearchHit<TypedElasticInstitution>[]> => {
  const scroll = elasticScroll<TypedElasticInstitution>({
    index: depositorsIndex,
    scroll: '30s',
    body: {
      query: {
        term: {
          type: 'institution',
        },
      },
      sort: [
        '_doc',
      ],
    },
  });

  const hits = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const hit of scroll) {
    hits.push(hit);
  }

  return hits;
};
