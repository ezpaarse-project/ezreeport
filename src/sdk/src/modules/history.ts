import { parseISO } from 'date-fns';
import { axiosWithErrorFormatter, type PaginatedApiResponse } from '../lib/axios';
import { parseTaskWithNamespace, type RawTaskWithNamespace, type TaskWithNamespace } from './tasks.base';

export interface RawHistory {
  id: string,
  taskId: string,
  type: string,
  message: string,
  data?: object,

  createdAt: string, // Date
}

export interface History extends Omit<RawHistory, 'createdAt'> {
  createdAt: Date,
}

interface RawHistoryWithTask extends Omit<RawHistory, 'taskId'> {
  task: RawTaskWithNamespace
}

export interface HistoryWithTask extends Omit<History, 'taskId'> {
  task: TaskWithNamespace
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param entry Raw history entry
 *
 * @returns Parsed history entry
 */
export const parseHistory = (entry: RawHistory): History => ({
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
const parseHistoryWithTask = (entry: RawHistoryWithTask): HistoryWithTask => ({
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
  paginationOpts?: { previous?: History['id'], count?: number },
  namespaces?: string[],
): Promise<PaginatedApiResponse<HistoryWithTask[]>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawHistoryWithTask[]>, 'get'>(
    'get',
    '/history',
    {
      params: {
        namespaces,
        ...(paginationOpts ?? {}),
      },
    },
  );

  return {
    ...response,
    content: content.map(parseHistoryWithTask),
  };
};
