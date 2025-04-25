import type { TemplateFilter } from '~/modules/templates';
import type { Task } from '~/modules/tasks';

import {
  createTaskLayoutHelperFrom,
  taskLayoutHelperToJSON,
  type TaskLayoutHelper,
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
  filters: TemplateFilter[] = [],
): TaskBodyHelper {
  return {
    version: 2,
    dateField,
    inserts,
    filters: new Map(filters?.map((filter) => [filter.name, filter]) ?? []),
    index,
  };
}

export function createTaskBodyHelperFrom(template: Task['template']): TaskBodyHelper {
  return createTaskBodyHelper(
    template.index,
    template.dateField,
    template.inserts?.map((l) => createTaskLayoutHelperFrom(l)) ?? [],
    template.filters,
  );
}

export function taskBodyHelperToJSON(template: TaskBodyHelper): Task['template'] {
  return {
    version: template.version,
    index: template.index,
    inserts: template.inserts.map((l) => taskLayoutHelperToJSON(l)),
    dateField: template.dateField,
    filters: Array.from(template.filters.values()),
  };
}

export function addLayoutOfHelper(
  body: TaskBodyHelper,
  layout: TaskLayoutHelper,
): TaskBodyHelper {
  if (body.inserts.some((l) => l.id === layout.id)) {
    throw new Error(`Layout "${layout.id}" already exists`);
  }
  body.inserts.splice(layout.at, 0, layout);
  return body;
}

export function removeLayoutOfHelper(
  body: TaskBodyHelper,
  layout: TaskLayoutHelper,
): TaskBodyHelper {
  const template = body;
  template.inserts = body.inserts.filter((l) => l.id !== layout.id);
  return body;
}

export function updateLayoutOfHelper(
  body: TaskBodyHelper,
  oldLayout: TaskLayoutHelper,
  newLayout: TaskLayoutHelper,
): TaskBodyHelper {
  const index = body.inserts.findIndex((l) => l.id === oldLayout.id);
  if (index < 0) {
    throw new Error(`Layout "${oldLayout.id}" not found`);
  }
  const template = body;
  template.inserts[index] = newLayout;
  return body;
}
