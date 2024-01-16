import { parseISO } from 'date-fns';

import { axiosWithErrorFormatter, type PaginatedApiResponse } from '../lib/axios';

import { parseTaskWithNamespace, type RawTaskWithNamespace, type TaskWithNamespace } from './tasks.base';

// Private export
export interface RawActivity {
  id: string,
  taskId: string,
  type: string,
  message: string,
  data?: object,

  createdAt: string, // Date
}

export interface Activity extends Omit<RawActivity, 'createdAt'> {
  createdAt: Date,
}

interface RawActivityWithTask extends Omit<RawActivity, 'taskId'> {
  task: RawTaskWithNamespace
}

export interface ActivityWithTask extends Omit<Activity, 'taskId'> {
  task: TaskWithNamespace
}

// Private export
/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param entry Raw history entry
 *
 * @returns Parsed history entry
 */
export const parseActivity = (entry: RawActivity): Activity => ({
  ...entry,

  createdAt: parseISO(entry.createdAt),
});

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param entry Raw history entry
 *
 * @returns Parsed history entry
 */
const parseActivityWithTask = (entry: RawActivityWithTask): ActivityWithTask => ({
  ...entry,
  task: parseTaskWithNamespace(entry.task),

  createdAt: parseISO(entry.createdAt),
});

/**
 * Get all available history entries
 *
 * Needs `namespaces[namespaceId].history-get` permission
 *
 * @param paginationOpts Options for pagination
 * @param namespaces
 *
 * @returns All history entries' info
 */
export const getAllEntries = async (
  paginationOpts?: { previous?: Activity['id'], count?: number },
  namespaces?: string[],
): Promise<PaginatedApiResponse<ActivityWithTask, 'id'>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawActivityWithTask, 'id'>, 'get'>(
    'get',
    '/tasks-activity',
    {
      params: {
        namespaces,
        ...(paginationOpts ?? {}),
      },
    },
  );

  return {
    ...response,
    content: content.map(parseActivityWithTask),
  };
};
