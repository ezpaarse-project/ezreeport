import { nanoid } from 'nanoid/non-secure';
import objectHash from 'object-hash';

import type { TemplateFilter, TemplateBodyFigure } from '~/modules/templates';

interface FigureHelper {
  readonly id: string;
  readonly type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>,
  slots: Set<number>,
  readonly hash: string
}

function hashFigure(figure: FigureHelper | TemplateBodyFigure): string {
  return objectHash({
    type: figure.type,
    data: 'data' in figure ? figure.data : undefined,
    filters: 'filters' in figure ? figure.filters : undefined,
    params: figure.params,
    slots: figure.slots,
  });
}

function createFigureHelper<T extends FigureHelper = FigureHelper>(
  type: string,
  params: Record<string, unknown> = {},
  slots?: number[],
): T {
  return {
    id: nanoid(),
    type,
    params,
    slots: new Set(slots ?? []),
    hash: '',
  } satisfies FigureHelper as T;
}

export interface FigureHelperWithData extends FigureHelper {
  data: string | unknown[];
}

export function createFigureHelperWithData<T extends FigureHelperWithData = FigureHelperWithData>(
  type: string,
  data: string | unknown[],
  params: Record<string, unknown> = {},
  slots?: number[],
): T {
  const figure = {
    ...createFigureHelper(type, params, slots),
    data,
  } satisfies FigureHelperWithData;

  figure.hash = hashFigure(figure);
  return figure as T;
}

export interface FigureHelperWithFilters extends FigureHelper {
  filters: Map<string, TemplateFilter>;
}

export function createFigureHelperWithFilters<
  T extends FigureHelperWithFilters = FigureHelperWithFilters,
>(
  type: string,
  filters: TemplateFilter[] = [],
  params: Record<string, unknown> = {},
  slots?: number[],
): T {
  const figure = {
    ...createFigureHelper(type, params, slots),
    filters: new Map(filters?.map((filter) => [filter.name, filter]) ?? []),
    hash: '',
  } satisfies FigureHelperWithFilters;

  figure.hash = hashFigure(figure);
  return figure as T;
}
