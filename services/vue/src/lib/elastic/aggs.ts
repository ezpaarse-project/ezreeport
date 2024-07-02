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
const handledKeys = new Set(['name', 'aggs', 'aggregations', 'order']);

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
