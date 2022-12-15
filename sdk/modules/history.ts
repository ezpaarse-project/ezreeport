import { parseISO } from 'date-fns';
import { axiosWithErrorFormatter, type PaginatedApiResponse } from '../lib/axios';

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
 * Get all available history entries
 *
 * Needs `history-get` permission
 *
 * @param paginationOpts Options for pagination
 * @param institution Force institution. Only available for SUPER_USERS, otherwise it'll be ignored.
 *
 * @returns All history entries' info
 */
export const getAllEntries = async (
  paginationOpts?: { previous?: History['id'], count?: number },
  institution?: string,
): Promise<PaginatedApiResponse<History[]>> => {
  const { data: { content, ...response } } = await axiosWithErrorFormatter<PaginatedApiResponse<RawHistory[]>, 'get'>(
    'get',
    '/history',
    {
      params: {
        institution,
        ...(paginationOpts ?? {}),
      },
    },
  );

  return {
    ...response,
    content: content.map(parseHistory),
  };
};
