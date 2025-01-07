/**
 * Type for a namespace
 */
export interface Namespace {
  /** Id */
  id: string;
  /** Namespace name */
  name: string;
  /** Credentials for fetchers used for namespace */
  fetchLogin: {
    elastic: {
      /** Elastic username used to fetch data for reports in this namespace */
      username: string;
    };
  };
  /** Additional options for fetchers used for namespace */
  fetchOptions: {
    elastic: {};
  };
  /** Namespace logo */
  logoId?: string;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt?: Date | null;
}

/**
 * Type for a namespace from the API
 */
export interface RawNamespace extends Omit<Namespace, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt?: string | null;
}
