export const aggregationTypes = [
  { isCommonlyFound: true, name: 'avg', type: 'metric' },
  { isCommonlyFound: true, name: 'cardinality', type: 'metric' },
  { isCommonlyFound: true, name: 'max', type: 'metric' },
  { isCommonlyFound: true, name: 'min', type: 'metric' },
  { isCommonlyFound: false, name: 'percentile_ranks', type: 'metric' },
  { isCommonlyFound: false, name: 'percentiles', type: 'metric' },
  { isCommonlyFound: false, name: 'stats', type: 'metric' },
  { isCommonlyFound: true, name: 'sum', type: 'metric' },
  { isCommonlyFound: false, name: 'value_count', type: 'metric' },

  // { name: 'cumulative_sum', type: 'pipeline', isCommonlyFound: false },
  // { name: 'derivative', type: 'pipeline', isCommonlyFound: false },
  // { name: 'max_bucket', type: 'pipeline', isCommonlyFound: false },
  // { name: 'min_bucket', type: 'pipeline', isCommonlyFound: false },
  // { name: 'moving_average', type: 'pipeline', isCommonlyFound: false },
  // { name: 'sum_bucket', type: 'pipeline', isCommonlyFound: false },

  { isCommonlyFound: false, name: 'adjacency_matrix', type: 'bucket' },
  { isCommonlyFound: false, name: 'auto_date_histogram', type: 'bucket' },
  { isCommonlyFound: true, name: 'date_histogram', type: 'bucket' },
  { isCommonlyFound: false, name: 'diversified_sampler', type: 'bucket' },
  { isCommonlyFound: false, name: 'filters', type: 'bucket' },
  { isCommonlyFound: false, name: 'geo_grid', type: 'bucket' },
  { isCommonlyFound: false, name: 'histogram', type: 'bucket' },
  { isCommonlyFound: false, name: 'range', type: 'bucket' },
  { isCommonlyFound: false, name: 'sampler', type: 'bucket' },
  { isCommonlyFound: false, name: 'significant_terms', type: 'bucket' },
  { isCommonlyFound: true, name: 'terms', type: 'bucket' },
  { isCommonlyFound: false, name: 'top_hits', type: 'bucket' },
  { isCommonlyFound: false, name: 'variable_width_histogram', type: 'bucket' },
] as const;

export type AggregationName = (typeof aggregationTypes)[number]['name'];
export type AggregationType = (typeof aggregationTypes)[number]['type'];

export function isAggregationName(name: string): name is AggregationName {
  return aggregationTypes.some((agg) => agg.name === name);
}
