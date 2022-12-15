import { parseISO } from 'date-fns';
import axios, { axiosWithErrorFormatter, type ApiResponse, type PaginatedApiResponse } from '../lib/axios';
import { parseHistory, type History, type RawHistory } from './history';
import type { Layout } from './templates';

export enum Recurrence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIENNIAL = 'BIENNIAL',
  YEARLY = 'YEARLY',
}

interface RawTask {
  id: string,
  name: string,
  institution: string,
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

export interface RawFullTask extends RawTask {
  template: {
    extends: string,
    fetchOptions?: object,
    inserts: (Layout & { at: number })[],
  },
  targets: string[],
  history: RawHistory[]
}

export interface FullTask extends Omit<RawFullTask, 'nextRun' | 'lastRun' | 'createdAt' | 'updatedAt' | 'history'> {
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
    template,
    targets,
    history,
    ...rawTask
  } = task;

  return {
    ...parseTask(rawTask),
    history: history.map(parseHistory),
    template,
    targets,
  };
};

export interface InputTask extends Pick<FullTask, 'name' | 'template' | 'targets' | 'recurrence'> {
  nextRun?: FullTask['nextRun'],
  enabled?: FullTask['enabled'],
}

/**
 * Get all available tasks
 *
 * Needs `tasks-get` permission
 *
 * @param paginationOpts Options for pagination
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns All tasks' info
 */
export const getAllTasks = async (
  paginationOpts?: { previous?: Task['id'], count?: number },
  institution?: string,
): Promise<PaginatedApiResponse<Task[]>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawTask[]>, 'get'>(
    'get',
    '/tasks',
    {
      params: {
        institution,
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
 * Needs `tasks-post` permission
 *
 * @param task Task's data
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Created task's info
 */
export const createTask = async (
  task: InputTask,
  institution?: string,
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$post<RawFullTask>(
    '/tasks',
    task,
    { params: { institution } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Get task info
 *
 * Needs `tasks-get-task` permission
 *
 * @param id Task's id
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Task's info
 */
export const getTask = async (
  id: Task['id'],
  institution?: string,
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$get<RawFullTask>(`/tasks/${id}`, { params: { institution } });

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Update a task
 *
 * Needs `tasks-put-task` permission
 *
 * @param id Task's id
 * @param task New Task's data
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Updated Task's info
 */
export const updateTask = async (
  id: Task['id'],
  task: InputTask,
  institution?: string,
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}`,
    task,
    { params: { institution } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Delete a task
 *
 * Needs `tasks-delete-task` permission
 *
 * @param id Task's id
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Deleted Task's info
 */
export const deleteTask = async (
  id: Task['id'],
  institution?: string,
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$delete<RawFullTask>(`/tasks/${id}`, { params: { institution } });

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Shorthand to enable task
 *
 * Needs `tasks-put-task-enable` permission
 *
 * @param id Task's id
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Updated task's info
 */
export const enableTask = async (
  id: Task['id'],
  institution?: string,
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}/enable`,
    undefined,
    { params: { institution } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Shorthand to disable task
 *
 * Needs `tasks-put-task-disable` permission
 *
 * @param id Task's id
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns Updated task's info
 */
export const disableTask = async (
  id: Task['id'],
  institution?: string,
): Promise<ApiResponse<FullTask>> => {
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}/disable`,
    undefined,
    { params: { institution } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};
