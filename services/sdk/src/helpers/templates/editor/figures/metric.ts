import type { TemplateFilter, TemplateBodyFigure } from '~/modules/templates';
import type { FigureAggregation } from '../aggregations';
import type { FigureOrder } from './utils';
import {
  type FigureHelperWithFilters,
  createFigureHelperWithFilters,
} from './base';

/**
 * Type for labels used in metrics
 */
export interface MetricLabel {
  /**
   * The text of the label (rendered under the value)
   */
  text: string;
  /**
   * The aggregation used to fetch data,
   * if not set, the count of documents will be used
   */
  aggregation?: FigureAggregation;
  /**
   * Format options used to format the data
   */
  format?: {
    type: 'date' | 'number';
    params?: string[];
  };
}

export interface MetricFigureHelper extends FigureHelperWithFilters {
  readonly type: 'metric';
  params: {
    labels: MetricLabel[];
    order: FigureOrder;
  };
}

export function createMetricFigureHelper(
  labels: MetricLabel[] = [],
  filters: TemplateFilter[] = [],
  order: FigureOrder = true,
  slots?: number[]
): MetricFigureHelper {
  return createFigureHelperWithFilters(
    'metric',
    filters,
    {
      labels,
      order,
    },
    slots
  );
}

export function createMetricFigureHelperFrom(
  figure: TemplateBodyFigure
): MetricFigureHelper {
  return createMetricFigureHelper(
    figure.params?.labels ?? [],
    figure.filters ?? [],
    figure.params?.order ?? true,
    figure.slots
  );
}

export function metricHelperParamsToJSON(
  params: MetricFigureHelper['params']
): TemplateBodyFigure['params'] {
  return {
    labels: params.labels,
    order: params.order,
  };
}

export function getMetricLabelKey(label: MetricLabel): string {
  return label.text;
}

export function getAllMetricLabelKeysOfHelper(
  figure: MetricFigureHelper
): string[] {
  return figure.params.labels.map(getMetricLabelKey);
}

export function addMetricLabelOfHelper(
  figure: MetricFigureHelper,
  element: MetricLabel,
  index?: number
): MetricFigureHelper {
  const key = getMetricLabelKey(element);
  if (figure.params.labels.some((lab) => getMetricLabelKey(lab) === key)) {
    throw new Error(`Label "${element.text}" already exists`);
  }
  figure.params.labels.splice(index ?? figure.params.labels.length, 0, element);
  return figure;
}

export function removeMetricLabelOfHelper(
  figure: MetricFigureHelper,
  element: MetricLabel
): MetricFigureHelper {
  const fig = figure;
  const key = getMetricLabelKey(element);
  fig.params.labels = figure.params.labels.filter(
    (lab) => getMetricLabelKey(lab) !== key
  );
  return figure;
}

export function updateMetricLabelOfHelper(
  figure: MetricFigureHelper,
  oldElement: MetricLabel,
  newElement: MetricLabel
): MetricFigureHelper {
  const oldKey = getMetricLabelKey(oldElement);
  const index = figure.params.labels.findIndex(
    (lab) => getMetricLabelKey(lab) === oldKey
  );
  if (index < 0) {
    throw new Error(`Label "${oldElement.text}" not found`);
  }
  const fig = figure;
  fig.params.labels[index] = newElement;
  return figure;
}
