import type {
  TemplateFilter,
  TemplateBodyFigure as IFigure,
} from '~/modules/templates';
import type { FigureOrder } from './utils';

import {
  type MdFigure,
  createMdFigureHelper,
  createMdFigureHelperFrom,
  mdHelperParamsToJSON,
} from './md';
import {
  type MetricFigureHelper,
  createMetricFigureHelper,
  createMetricFigureHelperFrom,
  metricHelperParamsToJSON,
} from './metric';
import {
  type TableFigureHelper,
  createTableFigureHelper,
  createTableFigureHelperFrom,
  tableHelperParamsToJSON,
} from './table';
import {
  type VegaFigureHelper,
  createVegaFigureHelper,
  createVegaFigureHelperFrom,
  vegaHelperParamsToJSON,
} from './vega';

export type AnyFigureHelper =
  | MdFigure
  | MetricFigureHelper
  | TableFigureHelper
  | VegaFigureHelper;

export type FigureHelperSet = Map<string, AnyFigureHelper>;

/**
 * Create a figure helper
 *
 * @param figure The figure object
 *
 * @returns The figure helper
 */
export function createFigureHelper(
  type: AnyFigureHelper['type'],
  filters?: TemplateFilter[],
  order?: FigureOrder,
  slots?: number[]
): AnyFigureHelper {
  switch (type) {
    case 'md':
      return createMdFigureHelper(undefined, slots);

    case 'metric':
      return createMetricFigureHelper(undefined, filters, order, slots);

    case 'table':
      return createTableFigureHelper(
        undefined,
        undefined,
        undefined,
        filters,
        order,
        slots
      );

    default:
      return createVegaFigureHelper(
        type,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        filters,
        order,
        slots
      );
  }
}

/**
 * Create a figure helper from a figure object
 *
 * @param figure The figure object
 *
 * @returns The figure helper
 */
export function createFigureHelperFrom(figure: IFigure): AnyFigureHelper {
  switch (figure.type) {
    case 'md':
      return createMdFigureHelperFrom(figure);

    case 'metric':
      return createMetricFigureHelperFrom(figure);

    case 'table':
      return createTableFigureHelperFrom(figure);

    default:
      return createVegaFigureHelperFrom(figure);
  }
}

/**
 * Create a figure object from a figure helper
 *
 * @param figure The figure helper
 *
 * @returns The figure object
 */
export function figureHelperToJSON(figure: AnyFigureHelper): IFigure {
  let params: IFigure['params'] = {};
  switch (figure.type) {
    case 'md':
      params = mdHelperParamsToJSON((figure as MdFigure).params);
      break;

    case 'metric':
      params = metricHelperParamsToJSON((figure as MetricFigureHelper).params);
      break;

    case 'table':
      params = tableHelperParamsToJSON((figure as TableFigureHelper).params);
      break;

    default:
      params = vegaHelperParamsToJSON((figure as VegaFigureHelper).params);
      break;
  }

  return {
    type: figure.type,
    data: 'data' in figure ? figure.data : undefined,
    filters:
      'filters' in figure ? Array.from(figure.filters.values()) : undefined,
    params,
    slots: Array.from(figure.slots),
  };
}

export function isFigureHelperMarkdown(
  figure: AnyFigureHelper
): figure is MdFigure {
  return figure.type === 'md';
}
export function isFigureHelperMetric(
  figure: AnyFigureHelper
): figure is MetricFigureHelper {
  return figure.type === 'metric';
}
export function isFigureHelperTable(
  figure: AnyFigureHelper
): figure is TableFigureHelper {
  return figure.type === 'table';
}
export function isFigureHelperVega(
  figure: AnyFigureHelper
): figure is VegaFigureHelper {
  return (
    !isFigureHelperMarkdown(figure) &&
    !isFigureHelperMetric(figure) &&
    !isFigureHelperTable(figure)
  );
}

export * from './utils';
export * from './md';
export * from './metric';
export * from './table';
export * from './vega';
