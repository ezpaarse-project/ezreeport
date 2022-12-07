import { parseISO } from 'date-fns';

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
