import { parseISO } from 'date-fns';

// Private export
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

export interface TaskCount {
  _count: {
    tasks: number,
  }
}

export interface MembersCount {
  _count: {
    memberships: number,
  }
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
