import type { TemplateFilter } from '~/modules/templates/types';

import type { AggregationName } from './types';

export interface FigureRawAggregation {
  // oxlint-disable-next-line no-explicit-any
  raw: Record<string, any>;
}

export interface FigureFilterAggregationEntry {
  label: string;
  filters: TemplateFilter[];
}

export interface FigureFilterAggregation {
  type: 'filters';
  values: FigureFilterAggregationEntry[];
  missing?: string;
}

export interface FigureBaseAggregation {
  type: AggregationName;
  field: string;
  size?: number;
  missing?: string;
}

/**
 * Type for aggregations used in figures, when fetching data
 */
export type FigureAggregation =
  | FigureBaseAggregation
  | FigureFilterAggregation
  | FigureRawAggregation;

export function isRawAggregation(
  agg: FigureAggregation
): agg is FigureRawAggregation {
  return 'raw' in agg;
}

export * from './types';
