import { setTimeout } from 'node:timers/promises';

import {
  Client,
  type ClientOptions,
  type RequestParams,
  type estypes as ElasticTypes,
} from '@elastic/elasticsearch';
import { merge } from 'lodash';

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
  >(
    params,
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
