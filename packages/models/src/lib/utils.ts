import { differenceInMilliseconds, type Interval } from '@ezreeport/dates';

type BulkResultType = 'created' | 'updated' | 'deleted';

export type BulkResult<Type> =
  | {
      type: BulkResultType;
      data: Type;
    }
  | { type: 'none' };

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
  target = FormatIntervalTarget.Seconds
): string => (differenceInMilliseconds(end, start) / target).toFixed(2);

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
  encoding: 'base64' | 'base64url' = 'base64'
): string => Buffer.from(str).toString(encoding);

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
  encoding: 'base64' | 'base64url' = 'base64'
): string => Buffer.from(b64, encoding).toString();

/**
 * Ensure value is an array
 *
 * @param value Value to ensure
 *
 * @returns Copy of value if an array, else an array containing the value
 */
export const ensureArray = <Type>(value: Type | Type[]): Type[] =>
  Array.isArray(value) ? [...value] : [value];

export function ensureInt(value: string | number | boolean): number {
  if (typeof value === 'string') {
    return Number.parseInt(value, 10);
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
}

type ParsedBulkResult<Type> = {
  type: Exclude<BulkResultType, 'none'>;
  data: Type;
};

/**
 * Parse promised bulk operation results into usable arrays
 *
 * @param itemsSettled Promised bulk operations
 *
 * @returns Bulk results
 */
export function parseBulkResults<Type>(
  itemsSettled: PromiseSettledResult<BulkResult<Type>>[]
): ParsedBulkResult<Type>[] {
  const results: ParsedBulkResult<Type>[] = [];
  for (const settled of itemsSettled) {
    if (settled.status === 'rejected') {
      throw new Error(settled.reason);
    }

    if (settled.value.type !== 'none') {
      results.push(settled.value);
    }
  }
  return results;
}

export const limitNumber = (min: number, value: number, max: number): number =>
  Math.max(min, Math.min(value, max));
