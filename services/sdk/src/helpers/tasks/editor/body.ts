import type { Task } from '~/modules/tasks';
import type { TemplateFilter } from '~/modules/templates';

import {
  type TaskLayoutHelper,
  createTaskLayoutHelperFrom,
  taskLayoutHelperToJSON,
} from '../../templates/editor/layouts';

export interface TaskBodyHelper {
  readonly version: number;
  filters: Map<string, TemplateFilter>;
  index: string;
  dateField?: string;
  inserts: TaskLayoutHelper[];
}

export function createTaskBodyHelper(
  index: string = '',
  dateField: string = '',
  inserts: TaskLayoutHelper[] = [],
  filters: TemplateFilter[] = []
): TaskBodyHelper {
  return {
    dateField,
    filters: new Map(filters?.map((filter) => [filter.name, filter])),
    index,
    inserts,
    version: 2,
  };
}

export function createTaskBodyHelperFrom(
  template: Task['template']
): TaskBodyHelper {
  return createTaskBodyHelper(
    template.index,
    template.dateField,
    template.inserts?.map((lay) => createTaskLayoutHelperFrom(lay)) ?? [],
    template.filters
  );
}

export function taskBodyHelperToJSON(
  template: TaskBodyHelper
): Task['template'] {
  return {
    dateField: template.dateField,
    filters: [...template.filters.values()],
    index: template.index,
    inserts: template.inserts.map((lay) => taskLayoutHelperToJSON(lay)),
    version: template.version,
  };
}

export function addLayoutOfHelper(
  body: TaskBodyHelper,
  layout: TaskLayoutHelper
): TaskBodyHelper {
  if (body.inserts.some((lay) => lay.id === layout.id)) {
    throw new Error(`Layout "${layout.id}" already exists`);
  }
  body.inserts.splice(layout.at, 0, layout);
  return body;
}

export function removeLayoutOfHelper(
  body: TaskBodyHelper,
  layout: TaskLayoutHelper
): TaskBodyHelper {
  const template = body;
  template.inserts = body.inserts.filter((lay) => lay.id !== layout.id);
  return body;
}

export function updateLayoutOfHelper(
  body: TaskBodyHelper,
  oldLayout: TaskLayoutHelper,
  newLayout: TaskLayoutHelper
): TaskBodyHelper {
  const index = body.inserts.findIndex((lay) => lay.id === oldLayout.id);
  if (index === -1) {
    throw new Error(`Layout "${oldLayout.id}" not found`);
  }
  const template = body;
  template.inserts[index] = newLayout;
  return body;
}
