import objectHash from 'object-hash';

import type { Task } from '~/modules/tasks';
import type { LastExtended, TaskRecurrence } from '~/modules/tasks/types';

import type { TemplateBodyHelper } from '../../templates/editor/body';
import type { LayoutHelper } from '../../templates/editor/layouts';
import {
  createTaskBodyHelper,
  createTaskBodyHelperFrom,
  taskBodyHelperToJSON,
  type TaskBodyHelper,
} from './body';

export interface TaskHelper {
  readonly id: string;
  name: string;
  namespaceId: string;
  extendedId: string;
  template: TaskBodyHelper;
  targets: string[];
  recurrence: TaskRecurrence;
  nextRun: Date;
  enabled: boolean;
  readonly lastExtended?: LastExtended | null;
  readonly lastRun?: Date;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly hash: string;
}

function hashTask(task: TaskHelper | Task): string {
  return objectHash({
    name: task.name,
    extendedId: task.extendedId,
    template: task.template,
    targets: task.targets,
    recurrence: task.recurrence,
    nextRun: task.nextRun,
    enabled: task.enabled,
  });
}

export function createTaskHelper(
  name: string = '',
  namespaceId: string = '',
  extendedId: string = '',
  template?: TaskBodyHelper,
  targets: string[] = [],
  recurrence: TaskRecurrence = 'DAILY',
  nextRun?: Date,
  enabled: boolean = true,
  lastExtended?: LastExtended,
  lastRun?: Date,
  id: string = '',
  createdAt: Date = new Date(),
  updatedAt?: Date,
): TaskHelper {
  const task = {
    id,
    name,
    namespaceId,
    extendedId,
    template: template ?? createTaskBodyHelper(),
    targets,
    recurrence,
    nextRun: nextRun ?? new Date(), // TODO: recurrence
    enabled,
    lastExtended,
    lastRun,
    createdAt,
    updatedAt,
    hash: '',
  };

  task.hash = hashTask(task);

  return task;
}

export function createTaskHelperFrom(task: Task): TaskHelper {
  return createTaskHelper(
    task.name,
    task.namespaceId,
    task.extendedId,
    createTaskBodyHelperFrom(task.template),
    task.targets,
    task.recurrence,
    task.nextRun,
    task.enabled,
    task.lastExtended ?? undefined,
    task.lastRun,
    task.id,
    task.createdAt,
    task.updatedAt,
  );
}

export function taskHelperToJSON(task: TaskHelper): Task {
  return {
    id: task.id,
    name: task.name,
    namespaceId: task.namespaceId,
    extendedId: task.extendedId,
    template: taskBodyHelperToJSON(task.template),
    targets: task.targets,
    recurrence: task.recurrence,
    nextRun: task.nextRun,
    enabled: task.enabled,
    lastExtended: task.lastExtended,
    lastRun: task.lastRun,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function hasTaskChanged(task: TaskHelper): boolean {
  return task.hash !== hashTask(task);
}

export function getLayoutsOfHelpers(
  taskBody: TaskBodyHelper,
  templateBody: TemplateBodyHelper,
): (LayoutHelper & { readonly: boolean })[] {
  const layouts = templateBody.layouts.map((l) => ({ ...l, readonly: true }));
  // eslint-disable-next-line no-restricted-syntax
  for (const { at, ...layout } of taskBody.inserts) {
    layouts.splice(at, 0, { ...layout, readonly: false });
  }
  return layouts;
}

export {
  type TaskBodyHelper,
  addLayoutOfHelper,
  removeLayoutOfHelper,
  updateLayoutOfHelper,
} from './body';
