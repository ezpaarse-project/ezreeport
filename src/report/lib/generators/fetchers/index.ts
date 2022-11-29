import type { EventEmitter } from 'node:events';
import elasticFetcher from './elastic';

/**
 * List of fetchers implemented.
 *
 * First param is an object that can have any option
 * Second param is a event emitter
 * Must return data
 */
const fetchers = {
  none: (_o: Record<string, unknown>, _e: EventEmitter) => [],
  elastic: elasticFetcher,
} as const;
export type Fetchers = typeof fetchers;

export default fetchers;
