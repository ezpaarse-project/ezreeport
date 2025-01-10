import type { AggregationName, FigureBaseAggregation, FigureRawAggregation } from '~sdk/helpers/aggregations';

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

export const aggregationFieldType = new Map<AggregationName, string>([
  ['avg', 'number'],
  ['max', 'number'],
  ['min', 'number'],
  ['percentile_ranks', 'number'],
  ['percentiles', 'number'],
  ['stats', 'number'],
  ['sum', 'number'],

  ['auto_date_histogram', 'date'],
  ['date_histogram', 'date'],
  ['geo_grid', 'geo'],
  ['histogram', 'number'],
  ['range', 'number'],
  ['top_hits', 'object'],
  ['variable_width_histogram', 'number'],
]);
