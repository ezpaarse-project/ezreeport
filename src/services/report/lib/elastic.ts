import { setTimeout } from 'node:timers/promises';

import { Client, type estypes as ElasticTypes, type RequestParams } from '@elastic/elasticsearch';
import { merge } from 'lodash';

import config from './config';
import { appLogger as logger } from './logger';

const {
  url,
  username,
  password,
  apiKey,
  requiredStatus,
  maxTries,
} = config.elasticsearch;

enum ElasticStatus {
  red,
  yellow,
  green,
}
type KeyofElasticStatus = keyof typeof ElasticStatus;

const isElasticStatus = (
  status: string,
): status is KeyofElasticStatus => Object.keys(ElasticStatus).includes(status);

// Parse some env var
const REQUIRED_STATUS = isElasticStatus(requiredStatus) ? requiredStatus : 'green';
const ES_AUTH = apiKey ? { apiKey } : { username, password };

const client = new Client({
  node: {
    url: new URL(url),
  },
  auth: ES_AUTH,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Get elastic client once it's ready
 *
 * @returns Elastic client
 */
const getElasticClient = async () => {
  let tries = 0;
  while (tries < maxTries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body: { status } } = await client.cluster.health<ElasticTypes.ClusterHealthResponse>({
        wait_for_status: REQUIRED_STATUS,
        timeout: '5s',
      });

      if (
        ElasticStatus[
          status.toLowerCase() as Lowercase<ElasticTypes.HealthStatus>
        ] >= ElasticStatus[REQUIRED_STATUS]
      ) {
        break;
      }
    } catch (error) {
      logger.error(`[elastic] Can't connect to Elastic : ${error}. ${maxTries - tries} tries left.`);
    }

    tries += 1;
    // eslint-disable-next-line no-await-in-loop
    await setTimeout(1000);
  }
  return client;
};

/**
 * Ping elastic to check connection
 *
 * @returns If elastic is up
 */
export const elasticPing = async () => {
  const elastic = await getElasticClient();

  const { body, statusCode } = await elastic.ping();

  return body && (statusCode || (body ? 200 : 500));
};

/**
 * Shorthand to search multiple queries with elastic
 *
 * @param params The search params
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The results of the search
 */
export const elasticMSearch = async <ResponseType extends Record<string, unknown>>(
  params: RequestParams.Msearch<ElasticTypes.MsearchRequestItem[]>,
  runAs?: string,
) => {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  return elastic.msearch<
  ElasticTypes.MsearchResponse<ResponseType>,
  ElasticTypes.MsearchRequestItem[]
  >(
    params,
    { headers },
  );
};

/**
 * Shorthand to count with elastic
 *
 * @param params The count params
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The result of the count
 */
export const elasticCount = async (
  params: ElasticTypes.CountRequest,
  runAs?: string,
) => {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  return elastic.count<ElasticTypes.CountResponse>(
    params as Record<string, unknown>,
    { headers },
  );
};

/**
 * Shorthand to list indices with elastic
 *
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The indices names
 */
export const elasticListIndices = async (runAs?: string) => {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  const { body } = await elastic.indices.resolveIndex<ElasticTypes.IndicesResolveIndexResponse>(
    { name: '*' },
    { headers },
  );

  const hiddenRegex = /^\./;
  return [
    ...body.indices.map((i) => i.name),
    ...body.aliases.map((a) => a.name),
  ].filter((n) => !hiddenRegex.test(n));
};

/**
 * Simplify mapping by flattening oject using dot notation
 *
 * @param properties Elastic raw mapping
 *
 * @returns Map of dot notation keys and type as value
 */
const simplifyMapping = (properties: Record<string, ElasticTypes.MappingProperty>) => {
  const res: Record<string, string> = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const [field, mapping] of Object.entries(properties)) {
    if (mapping.type) {
      res[field] = mapping.type;
    }

    if (mapping.properties) {
      const sub = simplifyMapping(mapping.properties);
      // eslint-disable-next-line no-restricted-syntax
      for (const [subField, type] of Object.entries(sub)) {
        res[`${field}.${subField}`] = type;
      }
    }
  }

  return res;
};

/**
 * Shorthand to get index mapping with elastic
 *
 * @param index name of the index
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The js-like index mapping
 */
export const elasticIndexMapping = async (index: string, runAs?: string) => {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  const { body } = await elastic.indices.getMapping<ElasticTypes.IndicesGetMappingResponse>(
    { index },
    { headers },
  );

  // Keep all the keys of all the indices
  const mappings = Object.values(body).map((i) => i.mappings.properties ?? {});
  const globalMapping = merge({}, ...mappings);
  return simplifyMapping(globalMapping);
};

export const elasticResolveIndex = async (index: string, runAs?: string) => {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  try {
    const { body } = await elastic.indices.resolveIndex<ElasticTypes.IndicesResolveIndexResponse>(
      { name: index },
      { headers },
    );

    return [
      ...body.indices.map((i) => i.name),
      ...body.aliases.map((a) => a.name),
    ].sort((a, b) => a.localeCompare(b));
  } catch (error) {
    const elasticError = error as ({ meta?: { body?: { error?: { type?: string } } } } & Error);
    if (elasticError.meta?.body?.error?.type === 'security_exception') {
      return [];
    }
    throw error;
  }
};
