export const aggregationTypes = [
  { name: 'avg', type: 'metric', isCommonlyFound: true },
  { name: 'cardinality', type: 'metric', isCommonlyFound: true },
  { name: 'max', type: 'metric', isCommonlyFound: true },
  { name: 'min', type: 'metric', isCommonlyFound: true },
  { name: 'percentile_ranks', type: 'metric', isCommonlyFound: false },
  { name: 'percentiles', type: 'metric', isCommonlyFound: false },
  { name: 'stats', type: 'metric', isCommonlyFound: false },
  { name: 'sum', type: 'metric', isCommonlyFound: true },
  { name: 'value_count', type: 'metric', isCommonlyFound: false },

  // { name: 'cumulative_sum', type: 'pipeline', isCommonlyFound: false },
  // { name: 'derivative', type: 'pipeline', isCommonlyFound: false },
  // { name: 'max_bucket', type: 'pipeline', isCommonlyFound: false },
  // { name: 'min_bucket', type: 'pipeline', isCommonlyFound: false },
  // { name: 'moving_average', type: 'pipeline', isCommonlyFound: false },
  // { name: 'sum_bucket', type: 'pipeline', isCommonlyFound: false },

  { name: 'adjacency_matrix', type: 'bucket', isCommonlyFound: false },
  { name: 'auto_date_histogram', type: 'bucket', isCommonlyFound: false },
  { name: 'date_histogram', type: 'bucket', isCommonlyFound: true },
  { name: 'diversified_sampler', type: 'bucket', isCommonlyFound: false },
  { name: 'filters', type: 'bucket', isCommonlyFound: false },
  { name: 'geo_grid', type: 'bucket', isCommonlyFound: false },
  { name: 'histogram', type: 'bucket', isCommonlyFound: false },
  { name: 'range', type: 'bucket', isCommonlyFound: false },
  { name: 'sampler', type: 'bucket', isCommonlyFound: false },
  { name: 'significant_terms', type: 'bucket', isCommonlyFound: false },
  { name: 'terms', type: 'bucket', isCommonlyFound: true },
  { name: 'top_hits', type: 'bucket', isCommonlyFound: false },
  { name: 'variable_width_histogram', type: 'bucket', isCommonlyFound: false },
] as const;

export type AggregationName = typeof aggregationTypes[number]['name'];
export type AggregationType = typeof aggregationTypes[number]['type'];

export function isAggregationName(name: string): name is AggregationName {
  return aggregationTypes.some((agg) => agg.name === name);
}
