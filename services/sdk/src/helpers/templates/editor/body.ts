import type { TemplateBody, TemplateFilter, TemplateBodyGrid } from '~/modules/templates';
import { createLayoutHelperFrom, layoutHelperToJSON, type LayoutHelper } from './layouts';

export interface TemplateBodyHelper {
  readonly version: number;
  filters: Map<string, TemplateFilter>;
  index?: string;
  dateField: string;
  layouts: LayoutHelper[];
  grid?: TemplateBodyGrid;
}

export function createTemplateBodyHelper(
  index?: string,
  dateField: string = '',
  layouts: LayoutHelper[] = [],
  filters: TemplateFilter[] = [],
  grid?: TemplateBodyGrid,
): TemplateBodyHelper {
  return {
    version: 2,
    dateField,
    layouts,
    filters: new Map(filters?.map((filter) => [filter.name, filter]) ?? []),
    grid,
    index,
  };
}

export function createTemplateBodyHelperFrom(body: TemplateBody): TemplateBodyHelper {
  return createTemplateBodyHelper(
    body.index,
    body.dateField,
    body.layouts.map((l) => createLayoutHelperFrom(l)),
    body.filters,
    body.grid,
  );
}

export function templateHelperBodyToJSON(body: TemplateBodyHelper): TemplateBody {
  return {
    version: body.version,
    dateField: body.dateField,
    layouts: body.layouts.map((l) => layoutHelperToJSON(l)),
    filters: Array.from(body.filters.values()),
    grid: body.grid,
    index: body.index,
  };
}

export function addLayoutOfHelper(
  body: TemplateBodyHelper,
  layout: LayoutHelper,
  index?: number,
): TemplateBodyHelper {
  if (body.layouts.some((l) => l.id === layout.id)) {
    throw new Error(`Layout "${layout.id}" already exists`);
  }
  body.layouts.splice(index ?? body.layouts.length, 0, layout);
  return body;
}

export function removeLayoutOfHelper(
  body: TemplateBodyHelper,
  layout: LayoutHelper,
): TemplateBodyHelper {
  const template = body;
  template.layouts = body.layouts.filter((l) => l.id !== layout.id);
  return body;
}

export function updateLayoutOfHelper(
  body: TemplateBodyHelper,
  oldLayout: LayoutHelper,
  newLayout: LayoutHelper,
): TemplateBodyHelper {
  const index = body.layouts.findIndex((l) => l.id === oldLayout.id);
  if (index < 0) {
    throw new Error(`Layout "${oldLayout.id}" not found`);
  }
  const template = body;
  template.layouts[index] = newLayout;
  return body;
}
