import elasticFetcher from './elastic';

/**
 * List of fetchers implemented.
 *
 * First param is an object that can have any option
 * Second param is a event emitter
 * Must return data
 */
const fetchers = {
  elastic: elasticFetcher,
} as const;
export type Fetchers = typeof fetchers;

export default fetchers;
