import { parseISO } from 'date-fns';

import { client } from '~/lib/fetch';
import { transformCreatedUpdated } from '~/lib/transform';
import {
  apiRequestOptionsToQuery,
  type ApiResponse,
  type ApiResponsePaginated,
  type ApiRequestOptions,
  type ApiDeletedResponse,
  type SdkPaginated,
} from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import { transformNamespace } from '~/modules/namespaces/methods';
import type { RawNamespace } from '~/modules/namespaces/types';

import type { InputTask, RawTask, Task } from './types';

export const transformTask = (t: RawTask): Task => ({
  ...transformCreatedUpdated(t),
  nextRun: parseISO(t.nextRun),
  lastRun: t.lastRun ? parseISO(t.lastRun) : undefined,
  namespace: t.namespace && transformNamespace(t.namespace as RawNamespace),
});

type PaginatedTasks = SdkPaginated<Omit<Task, 'template'>>;

/**
 * Get all available tasks
 *
 * @returns All tasks' info
 */
export async function getAllTasks(
  opts?: ApiRequestOptions & { include?: string[] },
): Promise<PaginatedTasks> {
  const {
    content,
    meta: {
      total, count, page,
    },
  } = await client.fetch<ApiResponsePaginated<Omit<RawTask, 'body'>>>(
    '/tasks',
    {
      query: {
        ...apiRequestOptionsToQuery(opts),
        include: opts?.include,
      },
    },
  );

  return {
    items: content.map(transformTask),
    total,
    count,
    page,
  };
}
assignPermission(getAllTasks, 'GET /tasks', true);

/**
 * Get task info
 *
 * @param taskOrId Task or Task's id
 * @param include Fields to include
 *
 * @returns Task info
 */
export async function getTask(
  taskOrId: Omit<Task, 'template'> | string,
  include?: string[],
): Promise<Task> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  const {
    content,
  } = await client.fetch<ApiResponse<RawTask>>(`/tasks/${id}`, {
    query: { include },
  });

  return transformTask(content);
}
assignPermission(getTask, 'GET /tasks/:id', true);

/**
 * Create a new task
 *
 * @param task Task's data
 *
 * @returns Created task's info
 */
export async function createTask(
  task: InputTask,
): Promise<Task> {
  const { content } = await client.fetch<ApiResponse<RawTask>>(
    '/tasks',
    {
      method: 'POST',
      body: task,
    },
  );

  return transformTask(content);
}
assignPermission(createTask, 'POST /tasks', true);

/**
 * Update or create a task
 *
 * @param task Task's data **with id**
 *
 * @returns Updated/Created Task's info
 */
export async function upsertTask(
  { id, ...task }: InputTask & { id: Task['id'] },
): Promise<Task> {
  const {
    content,
  } = await client.fetch<ApiResponse<RawTask>>(
    `/tasks/${id}`,
    {
      method: 'PUT',
      body: task,
    },
  );

  return transformTask(content);
}
assignPermission(upsertTask, 'PUT /tasks/:id', true);

/**
 * Delete a task
 *
 * @param taskOrId Task or Task's id
 *
 * @returns Whether the task was deleted
 */
export async function deleteTask(
  taskOrId: Omit<Task, 'template'> | string,
): Promise<boolean> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    return false;
  }

  const {
    content,
  } = await client.fetch<ApiDeletedResponse>(
    `/tasks/${id}`,
    { method: 'DELETE' },
  );

  return content.deleted;
}
assignPermission(deleteTask, 'DELETE /tasks/:id', true);

/**
 * Unlink a task from it's template
 *
 * @param taskOrId Task or Task's id
 *
 * @returns Updated task
 */
export async function unlinkTaskFromTemplate(
  taskOrId: Omit<Task, 'template'> | string,
): Promise<Task> {
  const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  if (!id) {
    throw new Error('Task id is required');
  }

  const {
    content,
  } = await client.fetch<ApiResponse<RawTask>>(
    `/tasks/${id}/extends`,
    { method: 'DELETE' },
  );

  return transformTask(content);
}
assignPermission(unlinkTaskFromTemplate, 'DELETE /tasks/:id/extends', true);
