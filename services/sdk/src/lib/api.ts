export interface ApiResponse<Content> {
  /** API version */
  apiVersion: number;
  /** HTTP status */
  status: {
    code: number;
    message: string;
  };
  /** Content of response */
  content: Content;
}

export interface ApiResponsePaginated<
  Content,
  Meta extends Record<string, unknown> = Record<string, never>,
> extends ApiResponse<Content[]> {
  /** Meta about data */
  meta: Meta & {
    /** Total number of items */
    total: number;
    /** Current page */
    page: number;
    /** Count in page */
    count: number;
  };
}

export type ApiDeletedResponse = ApiResponse<{ deleted: boolean }>;

interface ApiRequestPagination {
  /** Count wanted in response, 0 to show all (15 by default) */
  count?: number;
  /** Page number (1 by default) */
  page?: number;
  /** Field to sort */
  sort?: string;
  /** Order of sort (asc by default) */
  order?: 'asc' | 'desc';
}

type PrimitiveType = number | string | boolean;

type ApiRequestFilters = Record<
  string,
  PrimitiveType | PrimitiveType[] | undefined
>;

export interface ApiRequestOptions {
  filters?: ApiRequestFilters;
  pagination?: ApiRequestPagination;
}

export function apiRequestOptionsToQuery(
  opts?: ApiRequestOptions
): ApiRequestFilters & ApiRequestPagination {
  return {
    ...opts?.filters,
    ...opts?.pagination,
  };
}

export interface SdkPaginated<Item> {
  items: Item[];
  total: number;
  count: number;
  page: number;
}
