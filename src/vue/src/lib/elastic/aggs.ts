import definitions from './aggs.json';

export type AggType = keyof typeof definitions;
export type AggDefinition = {
  common?: true,
  returnsArray: boolean,
  subAggregations: boolean,
  type: 'metric' | 'pipeline' | 'bucket'
};
export const aggsDefinition = definitions as Record<string, AggDefinition>;

export type ElasticAgg = {
  name?: string,
  aggs?: ElasticAgg[],
  aggregations?: ElasticAgg[],
} & { [type in AggType]?: Record<string, any> } & Record<string, any>;

/**
 * Root keys handled by the simple edition
 */
const handledKeys = new Set(['name', 'aggs', 'aggregations']);

/**
 * Additional possible sort options in a elastic request
 */
export const sortOptions = [
  '_count',
  '_key',
];

/**
 * Some aggregations types have different ways to handle the size parameter
 */
export const sizeKeyByType: Record<string, string> = {
  auto_date_histogram: 'buckets',
  variable_width_histogram: 'buckets',
  diversified_sampler: 'shards',
  sampler: 'shard_size',
} satisfies Partial<Record<keyof typeof definitions, string>>;

/**
 * Get unsupported keys of an aggregation
 *
 * @param agg The aggregation
 *
 * @returns The unsupported keys
 */
export const getUnknownKeysFromAgg = (
  agg: any,
) => {
  if (!agg) {
    return [];
  }
  return Object.keys(agg).filter((k) => !handledKeys.has(k));
};

/**
 * Get aggregation's type
 *
 * @param agg The aggregation
 *
 * @returns The aggregation's type
 */
export const getTypeFromAgg = (agg: any): string | undefined => getUnknownKeysFromAgg(agg)[0];

const isAggType = (type: string): type is AggType => type in definitions;

/**
 * Get aggregation type definition, if available
 *
 * @param type The aggregation's type
 *
 * @returns The aggregation type definition
 */
export const getTypeDefinitionFromAggType = (type: string | undefined) => {
  if (!type || !isAggType(type)) {
    return undefined;
  }

  return definitions[type] as AggDefinition;
};

/**
 * Get aggregation type definition, if available
 *
 * @param agg The aggregation
 *
 * @returns The aggregation type definition
 */
export const getTypeDefinitionFromAgg = (agg: any | undefined) => getTypeDefinitionFromAggType(
  getTypeFromAgg(agg),
);
