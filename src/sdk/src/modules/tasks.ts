import { parseISO } from 'date-fns';
import axios, { axiosWithErrorFormatter, type ApiResponse, type PaginatedApiResponse } from '../lib/axios';
import { parseHistory, type History, type RawHistory } from './history';
import { parseNamespace, type Namespace, type RawNamespace } from './namespaces';
import type { Layout } from './templates';

export enum Recurrence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIENNIAL = 'BIENNIAL',
  YEARLY = 'YEARLY',
}

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

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param task Raw task
 *
 * @returns Parsed task
 */
const parseTask = (task: RawTask): Task => ({
  ...task,
  nextRun: parseISO(task.nextRun),
  lastRun: task.lastRun ? parseISO(task.lastRun) : undefined,

  createdAt: parseISO(task.createdAt),
  updatedAt: task.updatedAt ? parseISO(task.updatedAt) : undefined,
});

export interface RawFullTask extends Omit<RawTask, 'namespaceId'> {
  template: {
    extends: string,
    fetchOptions?: object,
    inserts?: (Layout & { at: number })[],
  },
  namespace: RawNamespace,
  targets: string[],
  history: RawHistory[]
}

export interface FullTask extends Omit<RawFullTask, 'namespace' | 'history' | 'nextRun' | 'lastRun' | 'createdAt' | 'updatedAt'> {
  namespace: Namespace,
  history: History[],
  nextRun: Date,
  lastRun?: Date,

  createdAt: Date,
  updatedAt?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param task Raw task
 *
 * @returns Parsed task
 */
const parseFullTask = (task: RawFullTask): FullTask => {
  const {
    namespace,
    history,
    template,
    targets,
    ...rawTask
  } = task;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { namespaceId, ...parsedTask } = parseTask({
    namespaceId: namespace.id,
    ...rawTask,
  });

  return {
    ...parsedTask,

    namespace: parseNamespace(namespace),
    history: history.map(parseHistory),
    template,
    targets,
  };
};

export interface InputTask extends Pick<FullTask, 'name' | 'template' | 'targets' | 'recurrence'> {
  namespace?: Task['namespaceId'],
  nextRun?: FullTask['nextRun'],
  enabled?: FullTask['enabled'],
}

/**
 * Get all available tasks
 *
 * Needs `namespaces[namespaceId].tasks-get` permission
 *
 * @param paginationOpts Options for pagination
 * @param namespaces
 *
 * @returns All tasks' info
 */
export const getAllTasks = async (
  paginationOpts?: { previous?: Task['id'], count?: number },
  namespaces?: Namespace['name'][],
): Promise<PaginatedApiResponse<Task[]>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawTask[]>, 'get'>(
    'get',
    '/tasks',
    {
      params: {
        namespaces,
        ...(paginationOpts ?? {}),
      },
    },
  );

  return {
    ...response,
    content: content.map(parseTask),
  };
};

/**
 * Create a new task
 *
 * Needs `namespaces[namespaceId].tasks-post` permission
 *
 * @param task Task's data
 * @param namespaces
 *
 * @returns Created task's info
 */
export const createTask = async (
  task: InputTask,
  namespaces?: Namespace['name'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$post<RawFullTask>(
    '/tasks',
    task,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Get task info
 *
 * Needs `namespaces[namespaceId].tasks-get-task` permission
 *
 * @param id Task's id
 * @param namespaces
 *
 * @returns Task's info
 */
export const getTask = async (
  id: Task['id'],
  namespaces?: Namespace['name'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$get<RawFullTask>(`/tasks/${id}`, { params: { namespaces } });

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Update a task
 *
 * Needs `namespaces[namespaceId].tasks-put-task` permission
 *
 * @param id Task's id
 * @param task New Task's data
 * @param namespaces
 *
 * @returns Updated Task's info
 */
export const updateTask = async (
  id: Task['id'],
  task: InputTask,
  namespaces?: Namespace['name'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}`,
    task,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Delete a task
 *
 * Needs `namespaces[namespaceId].tasks-delete-task` permission
 *
 * @param id Task's id
 * @param namespaces
 *
 * @returns Deleted Task's info
 */
export const deleteTask = async (
  id: Task['id'],
  namespaces?: Namespace['name'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$delete<RawFullTask>(`/tasks/${id}`, { params: { namespaces } });

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Shorthand to enable task
 *
 * Needs `namespaces[namespaceId].tasks-put-task-enable` permission
 *
 * @param id Task's id
 * @param namespaces
 *
 * @returns Updated task's info
 */
export const enableTask = async (
  id: Task['id'],
  namespaces?: Namespace['name'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}/enable`,
    undefined,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Shorthand to disable task
 *
 * Needs `namespaces[namespaceId].tasks-put-task-disable` permission
 *
 * @param id Task's id
 * @param namespaces
 *
 * @returns Updated task's info
 */
export const disableTask = async (
  id: Task['id'],
  namespaces?: Namespace['name'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}/disable`,
    undefined,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};
