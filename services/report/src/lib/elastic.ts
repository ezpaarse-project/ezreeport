import {
  Client,
  type ClientOptions,
  type estypes as ElasticTypes,
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
  }
);

const { url, username, password, apiKey } = config.elasticsearch;

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
function getElasticClient(): Client {
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
 * Ping elastic to check connection
 *
 * @returns If elastic is up
 */
export async function elasticPing(): Promise<
  Omit<HeartbeatType, 'nextAt' | 'updatedAt'>
> {
  const elastic = getElasticClient();

  const { body } =
    await elastic.cluster.stats<ElasticTypes.ClusterStatsResponse>();

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
  };
}

/**
 * Shorthand to list indices with elastic
 *
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The indices names
 */
export async function elasticListIndices(runAs?: string): Promise<string[]> {
  const elastic = getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  const { body } =
    await elastic.indices.resolveIndex<ElasticTypes.IndicesResolveIndexResponse>(
      { name: '*' },
      { headers }
    );

  const hiddenRegex = /^\./;
  return [
    ...body.indices.map((index) => index.name),
    ...body.aliases.map((alias) => alias.name),
  ].filter((name) => !hiddenRegex.test(name));
}

/**
 * Simplify mapping by flattening object using dot notation
 *
 * @param properties Elastic raw mapping
 *
 * @returns Map of dot notation keys and type as value
 */
function simplifyMapping(
  properties: Record<string, ElasticTypes.MappingProperty>
): Record<string, string> {
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
}

/**
 * Shorthand to get index mapping with elastic
 *
 * @param index name of the index
 * @param runAs The user to impersonate (see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/run-as-privilege.html)
 *
 * @returns The js-like index mapping
 */
export async function elasticIndexMapping(
  index: string,
  runAs?: string
): Promise<Record<string, string>> {
  const elastic = getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  const { body } =
    await elastic.indices.getMapping<ElasticTypes.IndicesGetMappingResponse>(
      { index },
      { headers }
    );

  // Keep all the keys of all the indices
  const mappings = Object.values(body).map(
    (index) => index.mappings.properties ?? {}
  );
  const globalMapping = merge({}, ...mappings);
  return simplifyMapping(globalMapping);
}

export async function elasticResolveIndex(
  index: string,
  runAs?: string
): Promise<string[]> {
  const elastic = getElasticClient();

  const headers: Record<string, unknown> = {};
  if (runAs) {
    headers['es-security-runas-user'] = runAs;
  }

  try {
    const { body } =
      await elastic.indices.resolveIndex<ElasticTypes.IndicesResolveIndexResponse>(
        { name: index },
        { headers }
      );

    return [
      ...body.indices.map((index) => index.name),
      ...body.aliases.map((alias) => alias.name),
    ].sort((nameA, nameB) => nameA.localeCompare(nameB));
  } catch (error) {
    const elasticError = error as {
      meta?: { body?: { error?: { type?: string } } };
    } & Error;
    if (elasticError.meta?.body?.error?.type === 'security_exception') {
      return [];
    }
    throw error;
  }
}
