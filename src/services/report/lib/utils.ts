import { differenceInMilliseconds } from './date-fns';

export enum FormatIntervalTarget {
  Milliseconds = 1,
  Seconds = 100,
  Minutes = 6000,
  Hours = 360000,
}

export const formatInterval = (
  { start, end }: Interval,
  target = FormatIntervalTarget.Seconds,
) => (differenceInMilliseconds(end, start) / target).toFixed(2);

/**
 * Type guard for Promise.allSettled
 *
 * @param data The result of Promise.allSettled
 *
 * @returns Is promise settled is fullfield
 */
export const isFulfilled = <T>(data: PromiseSettledResult<T>): data is PromiseFulfilledResult<T> => data.status === 'fulfilled';

/**
 * Convert string to Base64
 *
 * @param str Base string to convert
 * @param encoding Specific encoding
 *
 * @returns Base64
 */
export const stringToB64 = (
  str: string,
  encoding: 'base64' | 'base64url' = 'base64',
) => Buffer.from(str).toString(encoding);

/**
 * Convert Base46 to string
 *
 * @param b64 Base base64 to convert
 * @param encoding Specific encoding
 *
 * @returns String
 */
export const b64ToString = (
  b64: string,
  encoding: 'base64' | 'base64url' = 'base64',
) => Buffer.from(b64, encoding).toString();

export type BulkResult<T> = {
  type: 'created' | 'updated' | 'deleted'
  data: T
} | { type: 'none' };

/**
 * Parse promised bulk operation results into usable arrays
 *
 * @param itemsSettled Promised bulk operations
 *
 * @returns Bulk results
 */
export const parseBulkResults = <T>(itemsSettled: PromiseSettledResult<BulkResult<T>>[]) => {
  const results: { type: Exclude<BulkResult<T>['type'], 'none'>, data: T }[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const settled of itemsSettled) {
    if (settled.status === 'rejected') {
      throw new Error(settled.reason);
    }

    if (settled.value.type !== 'none') {
      results.push(settled.value);
    }
  }
  return results;
};
