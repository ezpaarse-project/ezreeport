import { differenceInMilliseconds, type Interval } from '@ezreeport/dates';

export type BulkResult<T> = {
  type: 'created' | 'updated' | 'deleted'
  data: T
} | { type: 'none' };

export enum FormatIntervalTarget {
  Milliseconds = 1,
  Seconds = 100,
  Minutes = 6000,
  Hours = 360000,
}

/**
 * Format interval to human readable
 *
 * @param param0 The interval
 * @param target The target (default: FormatIntervalTarget.Seconds)
 *
 * @returns The formatted interval
 */
export const formatInterval = (
  { start, end }: Interval,
  target = FormatIntervalTarget.Seconds,
) => (differenceInMilliseconds(end, start) / target).toFixed(2);

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

/**
 * Ensure value is an array
 *
 * @param value Value to ensure
 *
 * @returns Copy of value if an array, else an array containing the value
 */
export const ensureArray = <T>(value: T | T[]): T[] => (
  Array.isArray(value) ? [...value] : [value]
);

export const ensureInt = (value: string | number | boolean): number => {
  if (typeof value === 'string') {
    return Number.parseInt(value, 10);
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
};

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
