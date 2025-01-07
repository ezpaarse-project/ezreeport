import type { FigureBaseAggregation, FigureRawAggregation } from '~sdk/helpers/aggregations';

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
