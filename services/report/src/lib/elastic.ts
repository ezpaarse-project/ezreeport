import {
  Client,
  estypes as ElasticTypes,
  type ClientOptions,
} from '@elastic/elasticsearch';
import { merge } from 'lodash';

import type { HeartbeatType } from '@ezreeport/heartbeats/types';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';

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
} = config.elasticsearch;

// Parse some env var
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
 * Get elastic client once it's ready
 *
 * @returns Elastic client
 */
const getElasticClient = async () => {
  if (!client) {
    client = new Client(clientConfig);

    logger.info({
      config: clientConfig.node,
      msg: 'Elastic client ready',
    });
  }
  return client;
};

/**
 * Ping elastic to check connection
 *
 * @returns If elastic is up
 */
export const elasticPing = async (): Promise<HeartbeatType> => {
  const elastic = await getElasticClient();

  const { body } = await elastic.cluster.stats<ElasticTypes.ClusterStatsResponse>();

  return {
    hostname: body.cluster_name,
    service: 'elastic',
    version: body.nodes.versions.at(0),
    filesystems: [
      {
        name: 'elastic',
        total: body.nodes.fs.total_in_bytes,
        used: body.nodes.fs.total_in_bytes - body.nodes.fs.available_in_bytes,
        available: body.nodes.fs.available_in_bytes,
      },
    ],
    updatedAt: new Date(),
  };
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
  for (const [field, mapping] of Object.entries(properties)) {
    if (mapping.type) {
      res[field] = mapping.type;
    }

    if (mapping.properties) {
      const sub = simplifyMapping(mapping.properties);
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
