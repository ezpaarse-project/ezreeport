import { parseISO } from 'date-fns';
import type { Recurrence } from './tasks.base';
import type { FullTemplate } from './templates';
import axios, { type ApiResponse } from '../lib/axios';

interface RawTasksPreset {
  id: string,
  name: string,
  recurrence: Recurrence,
  tags: {
    name: string,
    color?: string,
  }[],
  createdAt: string, // Date
  updatedAt?: string, // Date
}

export interface TasksPreset extends Omit<RawTasksPreset, 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date,
}

const parsePreset = (preset: RawTasksPreset): TasksPreset => ({
  ...preset,
  createdAt: parseISO(preset.createdAt),
  updatedAt: preset.updatedAt ? parseISO(preset.updatedAt) : undefined,
});

export interface RawFullTasksPreset extends Omit<RawTasksPreset, 'tags'> {
  fetchOptions?: {
    dateField?: string,
  },
  template: Pick<FullTemplate, 'id' | 'name' | 'tags' | 'createdAt' | 'updatedAt'>
}

export interface FullTasksPreset extends Omit<RawFullTasksPreset, 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date,
}

export interface InputTasksPreset extends Pick<FullTasksPreset, 'name' | 'fetchOptions' | 'recurrence'> {
  template: string,
}

const parseFullPreset = (preset: RawFullTasksPreset): FullTasksPreset => ({
  ...preset,
  createdAt: parseISO(preset.createdAt),
  updatedAt: preset.updatedAt ? parseISO(preset.updatedAt) : undefined,
});

/**
 * Get all available tasks presets
 *
 * Needs `general.tasks-presets-get` permission
 *
 * @returns All presets' info
 */
export const getAllTasksPresets = async (): Promise<ApiResponse<TasksPreset[]>> => {
  const { content, ...r } = await axios.$get<RawTasksPreset[]>('/tasks-presets');
  return {
    ...r,
    content: content.map(parsePreset),
  };
};

/**
 * Get tasks preset info
 *
 * Needs `general.tasks-presets-get-preset` permission
 *
 * @param presetOrId Preset or Preset's id
 *
 * @returns Preset info
 */
export const getTasksPreset = async (
  presetOrId: TasksPreset | TasksPreset['id'],
): Promise<ApiResponse<FullTasksPreset>> => {
  const id = typeof presetOrId === 'string' ? presetOrId : presetOrId.id;
  const { content, ...r } = await axios.$get<RawFullTasksPreset>(`/tasks-presets/${id}`);
  return {
    ...r,
    content: parseFullPreset(content),
  };
};

/**
 * Create a new tasks preset
 *
 * Needs `general.tasks-presets-post` permission
 *
 * @param preset Preset's data
 * @param namespaces
 *
 * @returns Created preset's info
 */
export const createTasksPreset = async (
  preset: InputTasksPreset,
): Promise<ApiResponse<FullTasksPreset>> => {
  const { content, ...r } = await axios.$post<RawFullTasksPreset>('/tasks-presets/', preset);
  return {
    ...r,
    content: parseFullPreset(content),
  };
};

/**
 * Update or create a tasks preset
 *
 * Needs `general.tasks-presets-put-preset` permission
 *
 * @param preset Preset's data **with id**
 * @param namespaces
 *
 * @returns Updated/Created Preset's info
 */
export const upsertTasksPreset = async (
  preset: InputTasksPreset & { id: TasksPreset['id'] },
): Promise<ApiResponse<FullTasksPreset>> => {
  const { id, ...p } = preset;
  const { content, ...r } = await axios.$put<RawFullTasksPreset>(
    `/tasks-presets/${id}`,
    p,
  );
  return {
    ...r,
    content: parseFullPreset(content),
  };
};

/**
 * Delete a tasks preset
 *
 * Needs `general.tasks-presets-delete-preset` permission
 *
 * @param presetOrId Preset or Preset's id
 * @param namespaces
 */
export const deleteTasksPreset = async (
  presetOrId: TasksPreset | TasksPreset['id'],
): Promise<void> => {
  const id = typeof presetOrId === 'string' ? presetOrId : presetOrId.id;
  await axios.$delete(`/tasks-presets/${id}`);
};
