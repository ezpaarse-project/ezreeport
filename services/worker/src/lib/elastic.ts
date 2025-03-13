import { setTimeout } from 'node:timers/promises';

import {
  Client,
  type ClientOptions,
  type RequestParams,
  type estypes as ElasticTypes,
} from '@elastic/elasticsearch';

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

const clientConfig: ClientOptions = {
  node: {
    url: new URL(url),
  },
  auth: ES_AUTH,
  ssl: {
    rejectUnauthorized: false,
  },
};

const client = new Client(clientConfig);
let clientReadyPromise = undefined as Promise<void> | undefined;

async function checkClientReady() {
  const requiredValue = ElasticStatus[REQUIRED_STATUS];
  let tries = 0;
  let lastStatus: ElasticStatus | undefined;
  while (tries < 2) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body: { status } } = await client.cluster.health<ElasticTypes.ClusterHealthResponse>({
        wait_for_status: REQUIRED_STATUS,
        timeout: '5s',
      });

      const lowercaseStatus = status.toLowerCase() as Lowercase<ElasticTypes.HealthStatus>;
      const value = ElasticStatus[lowercaseStatus];
      lastStatus = value;
      // Break if status is valid
      if (value >= requiredValue) {
        break;
      }
    } catch (err) {
      logger.error({
        err,
        config: clientConfig.node,
        tries: {
          count: tries,
          max: maxTries,
        },
        msg: 'Can\'t connect to Elastic',
      });
    }

    tries += 1;
    // eslint-disable-next-line no-await-in-loop
    await setTimeout(1000);
  }

  if (!lastStatus || lastStatus < requiredValue) {
    throw new Error("Can't connect to Elastic. See previous logs for more info");
  }

  logger.info({
    config: clientConfig.node,
    msg: 'Connected to elastic',
  });
}

/**
 * Get elastic client once it's ready
 *
 * @returns Elastic client
 */
const getElasticClient = async () => {
  if (!clientReadyPromise) {
    clientReadyPromise = checkClientReady().finally(() => { clientReadyPromise = undefined; });
  }
  await clientReadyPromise;
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
  >(params, { headers });
};
