import type {
  TemplateBody,
  TemplateBodyGrid,
  TemplateFilter,
} from '~/modules/templates';

import {
  type LayoutHelper,
  createLayoutHelperFrom,
  layoutHelperToJSON,
} from './layouts';

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
  grid?: TemplateBodyGrid
): TemplateBodyHelper {
  return {
    dateField,
    filters: new Map(filters?.map((filter) => [filter.name, filter])),
    grid,
    index,
    layouts,
    version: 2,
  };
}

export function createTemplateBodyHelperFrom(
  body: TemplateBody
): TemplateBodyHelper {
  return createTemplateBodyHelper(
    body.index,
    body.dateField,
    body.layouts.map((lay) => createLayoutHelperFrom(lay)),
    body.filters,
    body.grid
  );
}

export function templateHelperBodyToJSON(
  body: TemplateBodyHelper
): TemplateBody {
  return {
    dateField: body.dateField,
    filters: [...body.filters.values()],
    grid: body.grid,
    index: body.index,
    layouts: body.layouts.map((lay) => layoutHelperToJSON(lay)),
    version: body.version,
  };
}

export function addLayoutOfHelper(
  body: TemplateBodyHelper,
  layout: LayoutHelper,
  index?: number
): TemplateBodyHelper {
  if (body.layouts.some((lay) => lay.id === layout.id)) {
    throw new Error(`Layout "${layout.id}" already exists`);
  }
  body.layouts.splice(index ?? body.layouts.length, 0, layout);
  return body;
}

export function removeLayoutOfHelper(
  body: TemplateBodyHelper,
  layout: LayoutHelper
): TemplateBodyHelper {
  const template = body;
  template.layouts = body.layouts.filter((lay) => lay.id !== layout.id);
  return body;
}

export function updateLayoutOfHelper(
  body: TemplateBodyHelper,
  oldLayout: LayoutHelper,
  newLayout: LayoutHelper
): TemplateBodyHelper {
  const index = body.layouts.findIndex((lay) => lay.id === oldLayout.id);
  if (index === -1) {
    throw new Error(`Layout "${oldLayout.id}" not found`);
  }
  const template = body;
  template.layouts[index] = newLayout;
  return body;
}
