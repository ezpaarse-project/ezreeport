import type { AggregationName } from './types';

export type FigureRawAggregation = { raw: Record<string, any> };

export type FigureBaseAggregation = {
  type: AggregationName;
  field: string;
  size?: number;
  missing?: string
};

/**
 * Type for aggregations used in figures, when fetching data
 */
export type FigureAggregation = FigureBaseAggregation | FigureRawAggregation;

export function isRawAggregation(agg: FigureAggregation): agg is FigureRawAggregation {
  return 'raw' in agg;
}

export * from './types';
