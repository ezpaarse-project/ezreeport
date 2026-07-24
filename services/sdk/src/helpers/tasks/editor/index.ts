import objectHash from 'object-hash';

import type { Task } from '~/modules/tasks';
import type {
  InputTask,
  LastExtended,
  TaskRecurrence,
  TaskRecurrenceOffset,
} from '~/modules/tasks/types';

import type { TemplateBodyHelper } from '../../templates/editor/body';
import type { AnyLayoutHelper } from '../../templates/editor/layouts';
import {
  type TaskBodyHelper,
  createTaskBodyHelper,
  createTaskBodyHelperFrom,
  taskBodyHelperToJSON,
} from './body';

export interface TaskHelper {
  readonly id: string;
  name: string;
  description: string;
  namespaceId: string;
  extendedId: string;
  template: TaskBodyHelper;
  targets: string[];
  recurrence: TaskRecurrence;
  recurrenceOffset: TaskRecurrenceOffset;
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
    description: task.description,
    enabled: task.enabled,
    extendedId: task.extendedId,
    name: task.name,
    nextRun: task.nextRun,
    recurrence: task.recurrence,
    targets: task.targets,
    template: task.template,
  });
}

export function createTaskHelper(
  name = '',
  description = '',
  namespaceId = '',
  extendedId = '',
  template?: TaskBodyHelper,
  targets: string[] = [],
  recurrence: TaskRecurrence = 'DAILY',
  recurrenceOffset: TaskRecurrenceOffset = {},
  nextRun: Date = new Date(),
  enabled = true,
  lastExtended?: LastExtended,
  lastRun?: Date,
  id = '',
  createdAt: Date = new Date(),
  updatedAt?: Date
): TaskHelper {
  const task = {
    createdAt,
    description,
    enabled,
    extendedId,
    hash: '',
    id,
    lastExtended,
    lastRun,
    name,
    namespaceId,
    nextRun,
    recurrence,
    recurrenceOffset,
    targets,
    template: template ?? createTaskBodyHelper(),
    updatedAt,
  };

  task.hash = hashTask(task);

  return task;
}

export function createTaskHelperFrom(task: Task): TaskHelper {
  return createTaskHelper(
    task.name,
    task.description,
    task.namespaceId,
    task.extendedId,
    createTaskBodyHelperFrom(task.template),
    task.targets,
    task.recurrence,
    task.recurrenceOffset,
    task.nextRun,
    task.enabled,
    task.lastExtended ?? undefined,
    task.lastRun,
    task.id,
    task.createdAt,
    task.updatedAt
  );
}

export function taskHelperToJSON(task: TaskHelper): InputTask {
  return {
    description: task.description,
    enabled: task.enabled,
    extendedId: task.extendedId,
    lastExtended: task.lastExtended,
    name: task.name,
    namespaceId: task.namespaceId,
    nextRun: task.nextRun,
    recurrence: task.recurrence,
    recurrenceOffset: task.recurrenceOffset,
    targets: task.targets,
    template: taskBodyHelperToJSON(task.template),
  };
}

export function hasTaskChanged(task: TaskHelper): boolean {
  return task.hash !== hashTask(task);
}

export function getLayoutsOfHelpers(
  taskBody: TaskBodyHelper,
  templateBody: TemplateBodyHelper
): (AnyLayoutHelper & { readonly: boolean })[] {
  const layouts = templateBody.layouts.map((lay) => ({
    ...lay,
    readonly: true,
  }));
  for (const { at, ...layout } of taskBody.inserts) {
    layouts.splice(at, 0, { ...layout, readonly: false });
  }
  return layouts;
}

export {
  type TaskBodyHelper,
  createTaskBodyHelper,
  createTaskBodyHelperFrom,
  addLayoutOfHelper,
  removeLayoutOfHelper,
  updateLayoutOfHelper,
} from './body';
