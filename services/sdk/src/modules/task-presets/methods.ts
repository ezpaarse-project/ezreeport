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

import { transformTask } from '~/modules/tasks/methods';
import type { RawTask, Task } from '~/modules/tasks/types';

import type {
  AdditionalDataForPreset,
  InputTaskPreset,
  RawTaskPreset,
  TaskPreset,
} from './types';

type PaginatedTaskPresets = SdkPaginated<TaskPreset>;

/**
 * Get all available tasks presets
 *
 * @returns All presets' info
 */
export async function getAllTaskPresets(
  opts?: ApiRequestOptions & { include?: string[] },
): Promise<PaginatedTaskPresets> {
  const {
    content,
    meta: { total, count, page },
  } = await client.fetch<ApiResponsePaginated<RawTaskPreset>>(
    '/task-presets',
    {
      query: {
        ...apiRequestOptionsToQuery(opts),
        include: opts?.include,
      },
    },
  );

  return {
    items: content.map(transformCreatedUpdated),
    total,
    count,
    page,
  };
}
assignPermission(getAllTaskPresets, 'GET /task-presets', true);

/**
 * Get tasks preset info
 *
 * @param presetOrId Preset or Preset's id
 *
 * @returns Preset info
 */
export async function getTaskPreset(
  presetOrId: TaskPreset | string,
): Promise<TaskPreset> {
  const id = typeof presetOrId === 'string' ? presetOrId : presetOrId.id;
  if (!id) {
    throw new Error('Task preset id is required');
  }

  const {
    content,
  } = await client.fetch<ApiResponse<RawTaskPreset>>(
    `/task-presets/${id}`,
  );
  return transformCreatedUpdated(content);
}
assignPermission(getTaskPreset, 'GET /task-presets/:id', true);

/**
 * Create a new tasks preset
 *
 * @param preset Preset's data
 * @param namespaces
 *
 * @returns Created preset's info
 */
export async function createTaskPreset(
  preset: InputTaskPreset,
): Promise<TaskPreset> {
  const {
    content,
  } = await client.fetch<ApiResponse<RawTaskPreset>>(
    '/task-presets/',
    {
      method: 'POST',
      body: preset,
    },
  );

  return transformCreatedUpdated(content);
}
assignPermission(createTaskPreset, 'POST /task-presets');

/**
 * Update or create a tasks preset
 *
 * @param preset Preset's data **with id**
 *
 * @returns Updated/Created Preset's info
 */
export async function upsertTaskPreset(
  { id, ...preset }: InputTaskPreset & { id: string },
): Promise<TaskPreset> {
  const {
    content,
  } = await client.fetch<ApiResponse<RawTaskPreset>>(
    `/task-presets/${id}`,
    {
      method: 'PUT',
      body: preset,
    },
  );

  return transformCreatedUpdated(content);
}
assignPermission(upsertTaskPreset, 'PUT /task-presets/:id');

/**
 * Delete a tasks preset
 *
 * @param presetOrId Preset or Preset's id
 *
 * @returns Whether the preset was deleted
 */
export async function deleteTaskPreset(
  presetOrId: TaskPreset | string,
): Promise<boolean> {
  const id = typeof presetOrId === 'string' ? presetOrId : presetOrId.id;
  if (!id) {
    return false;
  }

  const { content } = await client.fetch<ApiDeletedResponse>(
    `/task-presets/${id}`,
    {
      method: 'DELETE',
    },
  );

  return content.deleted;
}
assignPermission(deleteTaskPreset, 'DELETE /task-presets/:id');

/**
 * Create a task from a preset
 *
 * @param presetOrId Preset or Preset's id
 * @param additionalData Additional data for the task
 *
 * @returns Created task's info
 */
export async function createTaskFromPreset(
  presetOrId: TaskPreset | string,
  additionalData: AdditionalDataForPreset,
): Promise<Task> {
  const id = typeof presetOrId === 'string' ? presetOrId : presetOrId.id;
  if (!id) {
    throw new Error('Task preset id is required');
  }

  const {
    content,
  } = await client.fetch<ApiResponse<RawTask>>(
    `/task-presets/${id}/tasks`,
    {
      method: 'POST',
      body: additionalData,
    },
  );

  return transformTask(content);
}
assignPermission(createTaskFromPreset, 'POST /task-presets/:id/tasks');
