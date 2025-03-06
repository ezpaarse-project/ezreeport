// https://www.elastic.co/guide/en/elasticsearch/reference/7.17/mapping-types.html
export const elasticTypeAliases = new Map([
  // Common types
  ['binary', 'binary'],
  ['boolean', 'boolean'],
  ['array', 'array'],
  ['object', 'object'],
  ['nested', 'object'],
  // Keywords
  ['keyword', 'keyword'],
  ['constant_keyword', 'keyword'],
  // Text
  ['wildcard', 'text'],
  ['text', 'text'],
  ['search_as_you_type', 'text'],
  ['completion', 'text'],
  // Numbers
  ['long', 'number'],
  ['integer', 'number'],
  ['short', 'number'],
  ['byte', 'number'],
  ['double', 'number'],
  ['float', 'number'],
  ['half_float', 'number'],
  ['scaled_float', 'number'],
  ['unsigned_long', 'number'],
  // Dates
  ['date', 'date'],
  ['date_nanos', 'date'],
  // Ranges
  ['ip_range', 'ip'],
  ['integer_range', 'number'],
  ['float_range', 'number'],
  ['long_range', 'number'],
  ['double_range', 'number'],
  ['date_range', 'date'],
  // Geo
  ['geo_point', 'geo'],
  ['geo_shape', 'geo'],
  // Other types
  ['ip', 'ip'],
  ['token_count', 'number'],
  ['murmur3', 'object'],
  ['version', 'number'],
  ['rank_feature', 'rank'],
  ['rank_features', 'rank'],
  ['dense_vector', 'vector'],
  ['sparse_vector', 'vector'],
  ['flattened', 'object'],
]);

export const elasticTypeIcons = new Map([
  ['keyword', 'mdi-alphabetical'],
  ['number', 'mdi-numeric'],
  ['date', 'mdi-calendar-blank'],
  ['text', 'mdi-text'],
  ['binary', 'mdi-code-tags'],
  ['boolean', 'mdi-toggle-switch'],
  ['array', 'mdi-format-list-bulleted'],
  ['object', 'mdi-code-braces'],
  ['geo', 'mdi-map-marker'],
  ['ip', 'mdi-ip-network'],
  ['rank', 'mdi-chart-line'],
  ['vector', 'vector-line'],
]);
