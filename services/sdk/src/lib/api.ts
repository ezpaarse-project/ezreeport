export interface ApiResponse<T> {
  /** API version */
  apiVersion: number;
  /** HTTP status */
  status: {
    code: number;
    message: string;
  };
  /** Content of response */
  content: T;
}

export interface ApiResponsePaginated<
  T,
  M extends Record<string, unknown> = {},
> extends ApiResponse<T[]> {
  /** Meta about data */
  meta: M & {
    /** Total number of items */
    total: number,
    /** Current page */
    page: number,
    /** Count in page */
    count: number,
  };
}

export type ApiDeletedResponse = ApiResponse<{ deleted: boolean }>;

interface ApiRequestPagination {
  /** Count wanted in response, 0 to show all (15 by default) */
  count?: number,
  /** Page number (1 by default) */
  page?: number,
  /** Field to sort */
  sort?: string,
  /** Order of sort (asc by default) */
  order?: 'asc' | 'desc',
}

type PrimitiveType = number | string | boolean;

type ApiRequestFilters = Record<string, PrimitiveType | PrimitiveType[] | undefined>;

export interface ApiRequestOptions {
  filters?: ApiRequestFilters;
  pagination?: ApiRequestPagination;
}

export function apiRequestOptionsToQuery(opts?: ApiRequestOptions) {
  return {
    ...(opts?.filters ?? {}),
    ...(opts?.pagination ?? {}),
  };
}

export interface SdkPaginated<T> {
  items: T[];
  total: number;
  count: number;
  page: number;
}
