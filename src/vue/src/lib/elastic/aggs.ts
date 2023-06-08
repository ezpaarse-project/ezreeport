type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor;

type TypeDefinition = {
  [x: string]: PrimitiveConstructor | PrimitiveConstructor[] | TypeDefinition
};

export type AggDefinition = {
  canHaveSub?: true,
  isArray?: true,
  type?: TypeDefinition,
};

/**
 * Possible aggregations in an elastic request extracted both from TS types & documentation
 * Those who aren't supported by the interface are commented out
 *
 * NOTE: It can still be used by using the advanced edition
 */
export const aggsDefinition = {
  // 'meta': {},
  // 'adjacency_matrix': {},
  auto_date_histogram: {
    isArray: true,
    type: {
      key: Number,
      doc_count: Number,
      key_as_string: String,
    },
    canHaveSub: true,
  },
  avg: {
    type: {
      value: Number,
    },
  },
  // 'avg_bucket': {},
  boxplot: {
    type: {
      min: Number,
      max: Number,
      q1: Number,
      q2: Number,
      q3: Number,
      lower: Number,
      upper: Number,
    },
  },
  // 'bucket_script': {},
  // 'bucket_selector': {},
  // 'bucket_sort': {},
  cardinality: {
    type: {
      value: Number,
    },
  },
  categorize_text: {
    isArray: true,
    type: {
      doc_count: Number,
      key: String,
    },
    canHaveSub: true,
  },
  // 'cumulative_cardinality': {},
  // 'cumulative_sum': {},
  date_histogram: {
    isArray: true,
    type: {
      key: Number,
      doc_count: Number,
      key_as_string: String,
    },
    canHaveSub: true,
  },
  // 'date_range': {},
  // 'derivative': {},
  diversified_sampler: {
    type: {
      doc_count: Number,
    },
    canHaveSub: true,
  },
  // extended_stats: {}, // Too much stats
  // 'extended_stats_bucket': {},
  // 'filter': {},
  // 'filters': {},
  geo_bounds: {
    type: {
      bounds: {
        top_left: {
          lat: Number,
          lon: Number,
        },
        bottom_right: {
          lat: Number,
          lon: Number,
        },
      },
    },
  },
  geo_centroid: {
    type: {
      location: {
        lat: Number,
        lon: Number,
      },
      count: Number,
    },
  },
  // 'geo_distance': {},
  // 'geohash_grid': {},
  // 'geo_line': {},
  // 'geotile_grid': {},
  // 'global': {},
  histogram: {
    isArray: true,
    type: {
      key: [String, Number],
      doc_count: Number,
    },
    canHaveSub: true,
  },
  // 'ip_range': {},
  // 'inference': {},
  // 'line': {},
  // 'matrix_stats': {},
  max: {
    type: {
      value: Number,
    },
  },
  // 'max_bucket': {},
  median_absolute_deviation: {
    type: {
      value: Number,
    },
  },
  min: {
    type: {
      value: Number,
    },
  },
  // 'min_bucket': {},
  // 'missing': {},
  // 'moving_avg': {},
  // 'moving_percentiles': {},
  // 'moving_fn': {},
  // 'multi_terms': {},
  // 'nested': {},
  // 'normalize': {},
  // 'parent': {},
  // 'percentile_ranks': {},
  percentiles: {
    type: {
      values: {
        1: Number,
        5: Number,
        25: Number,
        50: Number,
        75: Number,
        95: Number,
        99: Number,
      },
    },
  },
  // 'percentiles_bucket': {},
  // 'range': {},
  rare_terms: {
    isArray: true,
    type: {
      key: [String, Number],
      doc_count: Number,
    },
    canHaveSub: true,
  },
  rate: {},
  // 'reverse_nested': {},
  sampler: {
    type: {
      doc_count: Number,
    },
    canHaveSub: true,
  },
  // 'scripted_metric': {},
  // 'serial_diff': {},
  significant_terms: {
    isArray: true,
    type: {
      key: [String, Number],
      doc_count: Number,
      score: Number,
      bg_count: Number,
    },
    canHaveSub: true,
  },
  significant_text: {
    isArray: true,
    type: {
      key: [String, Number],
      doc_count: Number,
      score: Number,
      bg_count: Number,
    },
    canHaveSub: true,
  },
  stats: {
    type: {
      count: Number,
      min: Number,
      max: Number,
      avg: Number,
      sum: Number,
    },
  },
  // 'stats_bucket': {},
  string_stats: {
    type: {
      count: Number,
      min_length: Number,
      max_length: Number,
      avg_length: Number,
      entropy: Number,
    },
  },
  sum: {
    type: {
      value: Number,
    },
  },
  // 'sum_bucket': {},
  terms: {
    isArray: true,
    type: {
      key: [String, Number],
      doc_count: Number,
    },
    canHaveSub: true,
  },
  // 'top_hits': {},
  // 't_test': {},
  // 'top_metrics': {},
  value_count: {
    type: {
      value: Number,
    },
  },
  // 'weighted_avg': {},
  variable_width_histogram: {
    isArray: true,
    type: {
      key: [String, Number],
      min: Number,
      max: Number,
      doc_count: Number,
    },
    canHaveSub: true,
  },
} satisfies Record<string, AggDefinition>;

export const aggsTypes = Object.keys(aggsDefinition);

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
} satisfies Partial<Record<keyof typeof aggsDefinition, string>>;
