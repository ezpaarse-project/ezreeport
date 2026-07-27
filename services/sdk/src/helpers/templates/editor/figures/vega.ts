import type { TemplateBodyFigure, TemplateFilter } from '~/modules/templates';

import type { FigureAggregation } from '../aggregations';
import type { FigureOrder } from './utils';
import {
  type FigureHelperWithFilters,
  createFigureHelperWithFilters,
} from './base';

/**
 * Type for layers used in vega
 */
export interface VegaLayer extends Record<string, unknown> {
  /**
   * The aggregation used to fetch data,
   * if not set, the "value" of the label (or color if present) layer will be used
   */
  aggregation?: FigureAggregation;
  /**
   * The title of the axis
   */
  title?: string;
  /**
   * The legend, if `null` no legend will be shown
   */
  legend?: null | { title?: string };
}

/**
 * Type for data label options
 */
export interface VegaDataLabelOptions {
  format: 'percent' | 'numeric';
  position?: 'out' | 'in';
  showLabel?: boolean;
  minValue?: number;
}

export interface VegaFigureHelper extends FigureHelperWithFilters {
  params: {
    /**
     * The title of the figure
     */
    title: string;
    /**
     * Whether the axis should be inverted
     */
    invertAxis?: boolean;
    /**
     * The label layer of the figure, often used for the x axis
     */
    label: VegaLayer;
    /**
     * The value layer of the figure, often used for the y axis
     */
    value: VegaLayer;
    /**
     * The color layer of the figure, often used for splitting the value
     */
    color?: VegaLayer;
    /**
     * The data label options
     *
     * Data labels are displayed on top of the value layer, and show details about values
     */
    dataLabel?: VegaDataLabelOptions;
    /**
     * The order of the data in the chart
     */
    order?: FigureOrder;
  };
}

export function createVegaFigureHelper(
  type: string,
  title: string = '',
  label: VegaLayer = {},
  value: VegaLayer = {},
  color?: VegaLayer,
  dataLabel?: VegaDataLabelOptions,
  invertAxis: boolean = false,
  filters: TemplateFilter[] = [],
  order: FigureOrder = true,
  slots?: number[]
): VegaFigureHelper {
  return createFigureHelperWithFilters(
    type,
    filters,
    {
      color,
      dataLabel,
      invertAxis,
      label,
      order,
      title,
      value,
    },
    slots
  );
}

export function createVegaFigureHelperFrom(
  figure: TemplateBodyFigure
): VegaFigureHelper {
  return createVegaFigureHelper(
    figure.type,
    figure.params?.title ?? '',
    figure.params?.label ?? {},
    figure.params?.value ?? {},
    figure.params?.color,
    figure.params?.dataLabel,
    figure.params?.invertAxis ?? false,
    figure.filters ?? [],
    figure.params?.order ?? true,
    figure.slots
  );
}

export function vegaHelperParamsToJSON(
  params: VegaFigureHelper['params']
): TemplateBodyFigure['params'] {
  return {
    color: params.color,
    dataLabel: params.dataLabel,
    invertAxis: params.invertAxis,
    label: params.label,
    order: params.order,
    title: params.title,
    value: params.value,
  };
}
