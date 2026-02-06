import type {
  AggregationName,
  FigureBaseAggregation,
  FigureFilterAggregation,
  FigureRawAggregation,
} from '~sdk/helpers/aggregations';

import { elasticTypeAliases } from './elastic';

export type InnerBaseAggregation = Omit<FigureBaseAggregation, 'type'> & {
  type: FigureBaseAggregation['type'] | '';
};

export type InnerAggregation =
  | FigureRawAggregation
  | FigureFilterAggregation
  | InnerBaseAggregation;

export const isRawAggregation = (
  agg: InnerAggregation | null
): agg is FigureRawAggregation => !!agg && 'raw' in agg && agg.raw != null;

export const isBaseAggregation = (
  agg: InnerAggregation | null
): agg is InnerBaseAggregation => !agg || ('type' in agg && agg.type != null);

export const isFiltersAggregation = (
  agg: InnerAggregation | null
): agg is FigureFilterAggregation =>
  isBaseAggregation(agg) && agg?.type === 'filters';

const typeAliases = Array.from(elasticTypeAliases.entries());
const findAliases = (search: string): string[] =>
  typeAliases.filter(([, alias]) => alias === search).map(([key]) => key);

const numberAliases = findAliases('number');
const dateAliases = findAliases('date');
const geoAliases = findAliases('geo');
const objectAliases = findAliases('object');

export const aggregationFieldTypes = new Map<AggregationName, string[]>([
  ['avg', numberAliases],
  ['percentile_ranks', numberAliases],
  ['percentiles', numberAliases],
  ['stats', numberAliases],
  ['sum', numberAliases],

  ['max', [...numberAliases, ...dateAliases]],
  ['min', [...numberAliases, ...dateAliases]],
  ['auto_date_histogram', dateAliases],
  ['date_histogram', dateAliases],
  ['geo_grid', geoAliases],
  ['histogram', numberAliases],
  ['range', numberAliases],
  ['top_hits', objectAliases],
  ['variable_width_histogram', numberAliases],
]);
