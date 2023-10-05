import axios, { axiosWithErrorFormatter, type ApiResponse, type PaginatedApiResponse } from '../lib/axios';

import { parseActivity, type Activity, type RawActivity } from './tasksActivity';
import type { Namespace } from './namespaces';
import {
  parseTemplate,
  type Layout,
  type RawTemplate,
  type Template,
} from './templates';

import {
  parseTask,
  parseTaskWithNamespace,
  type Task,
  type RawTaskWithNamespace,
  type TaskWithNamespace,
  type RawTask,
} from './tasks.base';

interface AdditionalRawTaskData {
  template: {
    fetchOptions?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filters?: Record<string, any>,
      dateField?: string,
      index: string,
    },
    inserts?: (Layout & { at: number })[],
  },
  extends: RawTemplate,
  lastExtended?: {
    id: string,
    tags: RawTemplate['tags']
  }
  targets: string[],
  activity: RawActivity[]
}

interface AdditionalTaskData extends Omit<AdditionalRawTaskData, 'activity' | 'extends' | 'lastExtended'> {
  activity: Activity[],
  extends: Template,
  lastExtended?: {
    id: Template['id'],
    name: Template['name'],
    tags: Template['tags']
  }
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
    activity,
    template,
    targets,
    extends: extended,
    ...rawTask
  } = task;

  return {
    ...parseTaskWithNamespace(rawTask),

    extends: parseTemplate(extended),
    activity: activity.map(parseActivity),
    template,
    targets,
  };
};

export interface InputTask extends Pick<FullTask, 'name' | 'template' | 'targets' | 'recurrence'> {
  namespace?: Task['namespaceId'],
  nextRun?: FullTask['nextRun'],
  enabled?: FullTask['enabled'],
  extends: string,
}

type RawTaskList = (RawTask & { tags: RawTemplate['tags'] })[];
export type TaskList = (Task & { tags: Template['tags'] })[];

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
): Promise<PaginatedApiResponse<TaskList>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawTaskList>, 'get'>(
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
    content: content.map(({ tags, ...task }) => ({
      tags,
      ...parseTask(task),
    })),
  };
};

/**
 * Get targets of available tasks
 *
 * Needs `namespaces[namespaceId].tasks-get-_targets` permission
 *
 * @param namespaces
 *
 * @returns Targets' email
 */
export const getAllTargets = (namespaces?: Namespace['id'][]) => axios.$get<string[]>(
  '/tasks/_targets',
  { params: { namespaces } },
);

/**
 * Get available tasks of specific target
 *
 * Needs `namespaces[namespaceId].tasks-get-_targets-email-tasks` permission
 *
 * @param email The email of the target
 * @param namespaces
 *
 * @returns Tasks where given email is a target
 */
export const getTasksOfTarget = async (email: string, namespaces?: Namespace['id'][]) => {
  const { content, ...response } = await axios.$get<RawTaskList>(
    `/tasks/_targets/${email}`,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: content.map(({ tags, ...task }) => ({
      tags,
      ...parseTask(task),
    })),
  };
};

/**
 * Unsubscribe a target from a task
 *
 * Needs `namespaces[namespaceId].tasks-get-_targets-email-tasks` permission
 *
 * @param email The email of the target
 * @param taskOrId Task or Task's id
 * @param namespaces
 */
export const unsubTargetOfTask = async (email: string, taskOrId: Task | Task['id'], namespaces?: Namespace['id'][]) => {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;

  await axios.$delete(`/tasks/_targets/${email}/tasks/${id}`, { params: { namespaces } });
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
 * @param taskOrId Task or Task's id
 * @param namespaces
 *
 * @returns Task's info
 */
export const getTask = async (
  taskOrId: Task | Task['id'],
  namespaces?: Namespace['id'][],
): Promise<ApiResponse<FullTask>> => {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
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
 * @param task Task's data **with id**
 * @param namespaces
 *
 * @returns Updated/Created Task's info
 */
export const upsertTask = async (
  task: InputTask & { id: Task['id'] },
  namespaces?: Namespace['id'][],
): Promise<ApiResponse<FullTask>> => {
  const { id, ...t } = task;
  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}`,
    t,
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
 * @param task Task's data **with id**
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
 * @param taskOrId Task or Task's id
 * @param namespaces
 */
export const deleteTask = async (
  taskOrId: Task | Task['id'],
  namespaces?: Namespace['id'][],
): Promise<void> => {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;

  await axios.$delete(`/tasks/${id}`, { params: { namespaces } });
};

/**
 * Shorthand to enable task
 *
 * Needs `namespaces[namespaceId].tasks-put-_task-enable` permission
 *
 * @param taskOrId Task or Task's id
 * @param namespaces
 *
 * @returns Updated task's info
 */
export const enableTask = async (
  taskOrId: Task | Task['id'],
  namespaces?: Namespace['id'][],
): Promise<ApiResponse<FullTask>> => {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;

  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}/_enable`,
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
 * Needs `namespaces[namespaceId].tasks-put-_task-disable` permission
 *
 * @param taskOrId Task or Task's id
 * @param namespaces
 *
 * @returns Updated task's info
 */
export const disableTask = async (
  taskOrId: Task | Task['id'],
  namespaces?: Namespace['id'][],
): Promise<ApiResponse<FullTask>> => {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;

  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${id}/_disable`,
    undefined,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Link a task to a template
 *
 * Needs `namespaces[namespaceId].tasks-put-task-_link-template` permission
 *
 * @param taskOrId Task or Task's id
 * @param templateOrId Template or Template's id
 * @param namespaces
 *
 * @returns Updated task's info
 */
export const linkTaskToTemplate = async (
  taskOrId: Task | Task['id'],
  templateOrId: Template | Template['id'],
  namespaces?: Namespace['id'][],
) => {
  const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  const templateId = typeof templateOrId === 'string' ? templateOrId : templateOrId.id;

  const { content, ...response } = await axios.$put<RawFullTask>(
    `/tasks/${taskId}/_link/${templateId}`,
    undefined,
    { params: { namespaces } },
  );

  return {
    ...response,
    content: parseFullTask(content),
  };
};

/**
 * Unlink a task to a template
 *
 * Needs `namespaces[namespaceId].tasks-delete-task-_link-template` permission
 *
 * @param taskOrId Task or Task's id
 * @param templateOrId Template or Template's id
 * @param namespaces
 */
export const unlinkTaskToTemplate = async (
  taskOrId: Task | Task['id'],
  templateOrId: Template | Template['id'],
  namespaces?: Namespace['id'][],
) => {
  const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  const templateId = typeof templateOrId === 'string' ? templateOrId : templateOrId.id;

  await axios.$delete<RawFullTask>(
    `/tasks/${taskId}/_link/${templateId}`,
    { params: { namespaces } },
  );
};
