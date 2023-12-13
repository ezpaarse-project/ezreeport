import { parseISO } from 'date-fns';

import { type RawNamespace, type Namespace, parseNamespace } from './namespaces';

export enum Recurrence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIENNIAL = 'BIENNIAL',
  YEARLY = 'YEARLY',
}

// Private export
export interface RawTask {
  id: string,
  name: string,
  namespaceId: string,
  recurrence: Recurrence,
  nextRun: string, // Date
  lastRun?: string, // Date
  enabled: boolean,

  createdAt: string, // Date
  updatedAt?: string, // Date
}

export interface Task extends Omit<RawTask, 'nextRun' | 'lastRun' | 'createdAt' | 'updatedAt'> {
  nextRun: Date,
  lastRun?: Date,

  createdAt: Date,
  updatedAt?: Date,
}

// Private export
/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param task Raw task
 *
 * @returns Parsed task
 */
export const parseTask = (task: RawTask): Task => ({
  ...task,
  nextRun: parseISO(task.nextRun),
  lastRun: task.lastRun ? parseISO(task.lastRun) : undefined,

  createdAt: parseISO(task.createdAt),
  updatedAt: task.updatedAt ? parseISO(task.updatedAt) : undefined,
});

// Private export
export interface RawTaskWithNamespace extends Omit<RawTask, 'namespaceId'> {
  namespace: RawNamespace,
}

export interface TaskWithNamespace extends Omit<Task, 'namespaceId'> {
  namespace: Namespace,
}

// Private export
/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param task Raw task with namespace
 *
 * @returns Parsed task with namespace
 */
export const parseTaskWithNamespace = (task: RawTaskWithNamespace): TaskWithNamespace => {
  const { namespace, ...rawTask } = task;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { namespaceId, ...parsedTask } = parseTask({
    namespaceId: namespace.id,
    ...rawTask,
  });

  return {
    ...parsedTask,
    namespace: parseNamespace(namespace),
  };
};
