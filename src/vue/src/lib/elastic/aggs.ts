/**
 * Possible aggregations in an elastic request extracted both from TS types & documentation
 * Those who aren't supported by the interface are commented out
 *
 * NOTE: It can still be used by using the advanced edition
 */
export const aggsTypes = [
  // 'meta',
  // 'adjacency_matrix',
  'auto_date_histogram',
  'avg',
  // 'avg_bucket',
  'boxplot',
  // 'bucket_script',
  // 'bucket_selector',
  // 'bucket_sort',
  'cardinality',
  'categorize_text',
  // 'cumulative_cardinality',
  // 'cumulative_sum',
  'date_histogram',
  // 'date_range',
  // 'derivative',
  'diversified_sampler',
  'extended_stats',
  // 'extended_stats_bucket',
  // 'filter',
  // 'filters',
  'geo_bounds',
  'geo_centroid',
  // 'geo_distance',
  // 'geohash_grid',
  // 'geo_line',
  // 'geotile_grid',
  // 'global',
  'histogram',
  // 'ip_range',
  // 'inference',
  // 'line',
  // 'matrix_stats',
  'max',
  // 'max_bucket',
  'median_absolute_deviation',
  'min',
  // 'min_bucket',
  // 'missing',
  // 'moving_avg',
  // 'moving_percentiles',
  // 'moving_fn',
  // 'multi_terms',
  // 'nested',
  // 'normalize',
  // 'parent',
  // 'percentile_ranks',
  'percentiles',
  // 'percentiles_bucket',
  // 'range',
  'rare_terms',
  'rate',
  // 'reverse_nested',
  'sampler',
  // 'scripted_metric',
  // 'serial_diff',
  'significant_terms',
  'significant_text',
  'stats',
  // 'stats_bucket',
  'string_stats',
  'sum',
  // 'sum_bucket',
  'terms',
  // 'top_hits',
  // 't_test',
  // 'top_metrics',
  'value_count',
  // 'weighted_avg',
  'variable_width_histogram',
];

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
};
