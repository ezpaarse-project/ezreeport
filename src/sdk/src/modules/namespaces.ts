import { parseISO } from 'date-fns';

export interface RawNamespace {
  id: string,
  name: string,
  logoId?: string,

  createdAt: string, // Date
  updatedAt?: string, // Date
}

export interface Namespace extends Omit<RawNamespace, 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param namespace Raw namespace
 *
 * @returns Parsed namespace
 */
export const parseNamespace = (namespace: RawNamespace): Namespace => ({
  ...namespace,

  createdAt: parseISO(namespace.createdAt),
  updatedAt: namespace.updatedAt ? parseISO(namespace.updatedAt) : undefined,
});

// TODO: API-KEY (ONLY IN NODE !)
