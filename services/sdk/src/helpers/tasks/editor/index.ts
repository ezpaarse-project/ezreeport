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
  createTaskBodyHelper,
  createTaskBodyHelperFrom,
  taskBodyHelperToJSON,
  type TaskBodyHelper,
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
    name: task.name,
    description: task.description,
    extendedId: task.extendedId,
    template: task.template,
    targets: task.targets,
    recurrence: task.recurrence,
    nextRun: task.nextRun,
    enabled: task.enabled,
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
  createdAt = new Date(),
  updatedAt?: Date
): TaskHelper {
  const task = {
    id,
    name,
    description,
    namespaceId,
    extendedId,
    template: template ?? createTaskBodyHelper(),
    targets,
    recurrence,
    recurrenceOffset,
    nextRun,
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
    name: task.name,
    description: task.description,
    namespaceId: task.namespaceId,
    extendedId: task.extendedId,
    template: taskBodyHelperToJSON(task.template),
    targets: task.targets,
    recurrence: task.recurrence,
    recurrenceOffset: task.recurrenceOffset,
    nextRun: task.nextRun,
    enabled: task.enabled,
    lastExtended: task.lastExtended,
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
