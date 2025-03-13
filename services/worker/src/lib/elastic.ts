import {
  Client,
  estypes as ElasticTypes,
  type ClientOptions,
  type RequestParams,
} from '@elastic/elasticsearch';

import { HeartbeatType } from '~common/lib/heartbeats';

import config from './config';
import { appLogger } from './logger';

const logger = appLogger.child(
  { scope: 'elastic' },
  {
    redact: {
      paths: ['config.*.password'],
      censor: (value) => value && ''.padStart(`${value}`.length, '*'),
    },
  },
);

const {
  url,
  username,
  password,
  apiKey,
  requiredStatus,
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

const clientConfig: ClientOptions = {
  node: {
    url: new URL(url),
  },
  auth: ES_AUTH,
  ssl: {
    rejectUnauthorized: false,
  },
};

let client: Client | undefined;

/**
 * Get elastic client
 *
 * @returns Elastic client
 */
export function initElasticClient() {
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
async function elasticReady() {
  const c = initElasticClient();

  await c.cluster.health<ElasticTypes.ClusterHealthResponse>({
    wait_for_status: REQUIRED_STATUS,
    timeout: '5s',
  });

  return c;
}

/**
 * Ping elastic to check connection
 *
 * @returns If elastic is up
 */
export const elasticPing = async (): Promise<HeartbeatType> => {
  const elastic = await elasticReady();

  const { body } = await elastic.cluster.stats<ElasticTypes.ClusterStatsResponse>();

  return {
    hostname: body.cluster_name,
    service: 'elastic',
    version: body.nodes.versions.at(0),
    updatedAt: new Date(),
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
export const elasticMSearch = async <ResponseType extends Record<string, unknown>>(
  params: RequestParams.Msearch<ElasticTypes.MsearchRequestItem[]>,
  runAs?: string,
) => {
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
