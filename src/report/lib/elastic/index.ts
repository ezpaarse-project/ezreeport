import { Client, estypes as ElasticTypes } from '@elastic/elasticsearch';
import { setTimeout } from 'node:timers/promises';
import config from '../config';
import logger from '../logger';

const {
  scheme, host, port, apiKey,
} = config.get('elasticsearch');

const client = new Client({
  node: {
    url: new URL(`${scheme}://${host}:${port}`),
  },
  auth: {
    apiKey,
  },
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' ?? false,
  },
});

const MAX_TRIES = 10;

export const READONLY_SUFFIX = '_read_only' as const;

/**
 * Get elastic client once it's ready
 *
 * @returns Elastic client
 */
export const getElasticClient = async () => {
  let tries = 0;
  while (tries < MAX_TRIES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body: { status } } = await client.cluster.health({
        wait_for_status: 'yellow',
        timeout: '5s',
      });

      if (status === 'yellow' || status === 'green') {
        break;
      }
    } catch (error) {
      logger.error(`[elastic] Can't connect to Elastic : ${error}. ${MAX_TRIES - tries} tries left.`);
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

  const { body } = await elastic.ping();

  return body;
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
    {
      headers,
    },
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
