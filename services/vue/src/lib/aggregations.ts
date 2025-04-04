import type { AggregationName, FigureBaseAggregation, FigureRawAggregation } from '~sdk/helpers/aggregations';
import { elasticTypeAliases } from './elastic';

export interface InnerBaseAggregation extends Omit<FigureBaseAggregation, 'type'> {
  type: FigureBaseAggregation['type'] | '';
}

export type InnerAggregation = FigureRawAggregation | InnerBaseAggregation;

export const isRawAggregation = (
  agg: InnerAggregation,
): agg is FigureRawAggregation => 'raw' in agg && !!agg.raw;

export const isBaseAggregation = (
  agg: InnerAggregation,
): agg is FigureBaseAggregation => !isRawAggregation(agg) && agg.type !== '';

const typeAliases = Array.from(elasticTypeAliases.entries());
const findAliases = (search: string) => typeAliases
  .filter(([, alias]) => alias === search).map(([key]) => key);

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
