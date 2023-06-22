import axios, { axiosWithErrorFormatter, type ApiResponse, type PaginatedApiResponse } from '../lib/axios';
import type { JsonObject } from '../lib/utils';
import { parseHistory, type History, type RawHistory } from './history';
import type { Namespace } from './namespaces';
import {
  parseTask,
  parseTaskWithNamespace,
  type Task,
  type RawTaskWithNamespace,
  type TaskWithNamespace,
  type RawTask
} from './tasks.base';
import type { Layout } from './templates';

interface AdditionalRawTaskData {
  template: {
    extends: string,
    fetchOptions?: JsonObject,
    inserts?: (Layout & { at: number })[],
  },
  targets: string[],
  history: RawHistory[]
}

interface AdditionalTaskData extends Omit<AdditionalRawTaskData, 'history'> {
  history: History[],
}

// Private export
export interface RawFullTask extends RawTaskWithNamespace, AdditionalRawTaskData {
}

export interface FullTask extends TaskWithNamespace, AdditionalTaskData {
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
    history,
    template,
    targets,
    ...rawTask
  } = task;

  return {
    ...parseTaskWithNamespace(rawTask),

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
  namespaces?: Namespace['id'][],
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
  namespaces?: Namespace['id'][],
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
  namespaces?: Namespace['id'][],
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$get<RawFullTask>(`/tasks/${id}`, { params: { namespaces } });

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Update or create a task
 *
 * Needs `namespaces[namespaceId].tasks-put-task` permission
 *
 * @param id Task's id
 * @param task Task's data
 * @param namespaces
 *
 * @returns Updated/Created Task's info
 */
export const upsertTask = async (
  id: Task['id'],
  task: InputTask,
  namespaces?: Namespace['id'][],
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
 * Update a task
 *
 * Needs `namespaces[namespaceId].tasks-put-task` permission
 *
 * @param id Task's id
 * @param task New Task's data
 * @param namespaces
 *
 * @deprecated Use `upsertTask` instead
 *
 * @returns Updated Task's info
 */
export const updateTask = upsertTask;

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
  namespaces?: Namespace['id'][],
): Promise<void> => {
  await axios.$delete(`/tasks/${id}`, { params: { namespaces } });
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
  namespaces?: Namespace['id'][],
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
  namespaces?: Namespace['id'][],
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
