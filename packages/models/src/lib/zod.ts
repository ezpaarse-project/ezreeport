import { z } from 'zod';

import { endOfDay, parseISO, startOfDay } from '@ezreeport/dates';
import { ensureArray } from './utils';

/**
 * Format Zod Issue
 *
 * @param issue Original Zod Issue
 *
 * @returns Simplified Zod Issue
 */
export function simplifyZodIssue(issue: z.ZodIssue) {
  return { ...issue, path: issue.path.join('/') };
}

/**
 * Ensure data matches schema, throws if doesn't match
 *
 * @param schema The zod schema
 * @param data The data
 * @param errorMessage Function to generate error message
 *
 * @returns The data passed through schema
 */
export async function ensureSchema<T, D>(
  schema: z.ZodSchema<T>,
  data: D,
  errorMessage: (d: D) => string = () => 'Failed to parse',
): Promise<T> {
  const result = await schema.safeParseAsync(data);
  if (!result.success) {
    throw new Error(errorMessage(data), {
      cause: result.error.issues.map((i) => simplifyZodIssue(i)),
    });
  }
  return result.data;
}

export const zStringOrArray = (
  z.string().min(1)
    .or(z.array(z.string().min(1)))
).transform((v) => ensureArray(v));

export const zStringToDay = (
  z.string().date()
    .or(z.string().datetime({ offset: true }))
).transform((v) => parseISO(v));

export const zStringToStartOfDay = zStringToDay
  .transform((v) => startOfDay(v));

export const zStringToEndOfDay = zStringToDay
  .transform((v) => endOfDay(v));

export const zStringToBool = z.preprocess((v) => {
  if (v === 'true') { return true; }
  if (v === 'false') { return false; }
  return Boolean(v);
}, z.boolean());

export * from 'zod';
