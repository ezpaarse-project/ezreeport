import { setTimeout } from 'node:timers/promises';

import { Client, type estypes as ElasticTypes, type RequestParams } from '@elastic/elasticsearch';
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
    rejectUnauthorized: process.env.NODE_ENV === 'production' ?? false,
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
