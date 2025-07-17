import type { TemplateFilter, TemplateBodyFigure } from '~/modules/templates';
import type { FigureAggregation } from '../aggregations';
import type { FigureOrder } from './utils';
import {
  type FigureHelperWithFilters,
  createFigureHelperWithFilters,
} from './base';

/**
 * Type for columns used in tables
 */
export interface TableColumn {
  /**
   * The name of the column
   */
  header: string;
  /**
   * Whether the column is a metric,
   * can only be used once in a table
   */
  metric?: boolean;
  /**
   * The aggregation used to fetch data,
   * if not set, the "value" of the previous column will be used
   */
  aggregation?: FigureAggregation;
  /**
   * The style of the cells in this column
   */
  styles?: {
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    fillColor?: string | [number, number, number];
    textColor?: string | [number, number, number];
    headerColor?: string | [number, number, number];
    halign?: 'left' | 'center' | 'right' | 'justify';
    valign?: 'top' | 'middle' | 'bottom';
    fontSize?: number;
    lineColor?: string | [number, number, number];
  };
}

/**
 * Type for tables
 */
export interface TableFigureHelper extends FigureHelperWithFilters {
  readonly type: 'table';
  params: {
    title: string;
    columns: TableColumn[];
    total?: boolean;
    order?: FigureOrder;
  };
}

export function createTableFigureHelper(
  title: string = '',
  columns: TableColumn[] = [],
  total: boolean = false,
  filters: TemplateFilter[] = [],
  order: FigureOrder = true,
  slots?: number[]
): TableFigureHelper {
  return createFigureHelperWithFilters(
    'table',
    filters,
    {
      title,
      columns,
      total,
      order,
    },
    slots
  );
}

export function createTableFigureHelperFrom(
  figure: TemplateBodyFigure
): TableFigureHelper {
  return createTableFigureHelper(
    figure.params?.title,
    figure.params?.columns ?? [],
    figure.params?.total ?? false,
    figure.filters ?? [],
    figure.params?.order ?? true,
    figure.slots
  );
}

export function tableHelperParamsToJSON(
  params: TableFigureHelper['params']
): TemplateBodyFigure['params'] {
  return {
    title: params.title,
    columns: params.columns,
    total: params.total,
    order: params.order,
  };
}

export function getTableColumnKey(column: TableColumn): string {
  return column.header;
}

export function getAllTableColumnKeysOfHelper(
  figure: TableFigureHelper
): string[] {
  return figure.params.columns.map(getTableColumnKey);
}

export function addTableColumnOfHelper(
  figure: TableFigureHelper,
  element: TableColumn,
  index?: number
): TableFigureHelper {
  const key = getTableColumnKey(element);
  if (figure.params.columns.some((col) => getTableColumnKey(col) === key)) {
    throw new Error(`Column "${element.header}" already exists`);
  }
  figure.params.columns.splice(
    index ?? figure.params.columns.length,
    0,
    element
  );
  return figure;
}

export function removeTableColumnOfHelper(
  figure: TableFigureHelper,
  element: TableColumn
): TableFigureHelper {
  const fig = figure;
  const key = getTableColumnKey(element);
  fig.params.columns = figure.params.columns.filter(
    (col) => getTableColumnKey(col) !== key
  );
  return figure;
}

export function updateTableColumnOfHelper(
  figure: TableFigureHelper,
  oldElement: TableColumn,
  newElement: TableColumn
): TableFigureHelper {
  const oldKey = getTableColumnKey(oldElement);
  const index = figure.params.columns.findIndex(
    (col) => getTableColumnKey(col) === oldKey
  );
  if (index < 0) {
    throw new Error(`Column "${oldKey}" not found`);
  }
  const fig = figure;
  fig.params.columns[index] = newElement;
  return figure;
}
