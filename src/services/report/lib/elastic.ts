import { Client, type estypes as ElasticTypes } from '@elastic/elasticsearch';
import { setTimeout } from 'node:timers/promises';
import config from './config';
import { appLogger as logger } from './logger';

const {
  url,
  username,
  password,
  apiKey,
  requiredStatus,
  maxTries,
} = config.get('elasticsearch');

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
    rejectUnauthorized: process.env.NODE_ENV === 'production' ?? false,
  },
});

export const READONLY_SUFFIX = '_read_only' as const;

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
 * Shorthand to search with elastic
 *
 * @param params The search params
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The result of the search
 */
export const elasticSearch = async <ResponseType extends Record<string, unknown>>(
  params: ElasticTypes.SearchRequest,
  runAs?: string,
) => {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  return elastic.search<ElasticTypes.SearchResponse<ResponseType>>(
    params as Record<string, unknown>,
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
 * Shorthand to check if a pattern, a pattern expression or an alias exist
 *
 * @param index The index
 *
 * @returns If index exist or not
 */
export const elasticCheckIndex = async (index: string): Promise<boolean> => {
  const elastic = await getElasticClient();

  const { body } = await elastic.indices.exists({ index, allow_no_indices: false });

  return body;
};

/**
 * Shorthand to scroll with elastic
 *
 * @param params The search params
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The result of the scroll
 */
export async function* elasticScroll<ResponseType extends Record<string, unknown>>(
  params: ElasticTypes.SearchRequest,
  runAs?: string,
) {
  const elastic = await getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  let response = await elastic.search<ElasticTypes.SearchResponse<ResponseType>>(
    params as Record<string, unknown>,
    { headers },
  );

  while (true) {
    const { body: { _scroll_id: scrollId, hits: { hits } } } = response;

    // eslint-disable-next-line no-restricted-syntax
    for (const hit of hits) {
      yield hit;
    }

    if (hits.length === 0 || !scrollId) {
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    response = await client.scroll(
      {
        scroll_id: scrollId,
        scroll: params.scroll?.toString(),
      },
      { headers },
    );
  }
}