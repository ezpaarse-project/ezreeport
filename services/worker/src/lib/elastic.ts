import {
  type ApiResponse,
  Client,
  type ClientOptions,
  type estypes as ElasticTypes,
  type RequestParams,
} from '@elastic/elasticsearch';

import type { HeartbeatType } from '@ezreeport/heartbeats/types';

import config from './config';
import { appLogger } from './logger';

const logger = appLogger.child(
  { scope: 'elastic' },
  {
    redact: {
      censor: (value) => value && ''.padStart(`${value}`.length, '*'),
      paths: ['config.auth.password'],
    },
  }
);

const { url, username, password, apiKey, requiredStatus } =
  config.elasticsearch;

enum ElasticStatus {
  red = 0,
  yellow = 1,
  green = 2,
}
type KeyofElasticStatus = keyof typeof ElasticStatus;

const isElasticStatus = (status: string): status is KeyofElasticStatus =>
  Object.keys(ElasticStatus).includes(status);

// Parse some env var
const REQUIRED_STATUS = isElasticStatus(requiredStatus)
  ? requiredStatus
  : 'green';
const ES_AUTH = apiKey ? { apiKey } : { password, username };

const clientConfig: ClientOptions = {
  auth: ES_AUTH,
  node: {
    url: new URL(url),
  },
  ssl: {
    rejectUnauthorized: false,
  },
};

let client: Client | null = null;

/**
 * Get elastic client
 *
 * @returns Elastic client
 */
export function initElasticClient(): Client {
  if (!client) {
    client = new Client(clientConfig);

    logger.info({
      config: clientConfig.node,
      msg: 'Elastic client ready',
    });
  }

  return client;
}

/**
 * Get elastic client once it's ready
 *
 * @returns Elastic client
 */
export async function elasticReady(): Promise<Client> {
  const elastic = initElasticClient();

  await elastic.cluster.health<ElasticTypes.ClusterHealthResponse>({
    timeout: '5s',
    wait_for_status: REQUIRED_STATUS,
  });

  return elastic;
}

/**
 * Ping elastic to check connection
 *
 * @returns If elastic is up
 */
export const elasticPing = async (): Promise<
  Omit<HeartbeatType, 'nextAt' | 'updatedAt'>
> => {
  const elastic = await elasticReady();

  const { body } =
    await elastic.cluster.stats<ElasticTypes.ClusterStatsResponse>();

  return {
    filesystems: [
      {
        available: body.nodes.fs.available_in_bytes,
        name: 'elastic',
        total: body.nodes.fs.total_in_bytes,
        used: body.nodes.fs.total_in_bytes - body.nodes.fs.available_in_bytes,
      },
    ],
    hostname: body.cluster_name,
    service: 'elastic',
    version: body.nodes.versions.at(0),
  };
};

/**
 * Shorthand to search multiple queries with elastic
 *
 * @param params The search params
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The results of the search
 */
export const elasticMSearch = async <
  ResponseType extends Record<string, unknown>,
>(
  params: RequestParams.Msearch<ElasticTypes.MsearchRequestItem[]>,
  runAs?: string
): Promise<ApiResponse<ElasticTypes.MsearchResponse<ResponseType>>> => {
  const elastic = await elasticReady();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  return elastic.msearch<
    ElasticTypes.MsearchResponse<ResponseType>,
    ElasticTypes.MsearchRequestItem[]
  >(params, { headers });
};
