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
export function simplifyZodIssue(
  issue: z.ZodIssue
): Omit<z.ZodIssue, 'path'> & { path: string } {
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
export async function ensureSchema<Type, Data>(
  schema: z.ZodSchema<Type>,
  data: Data,
  errorMessage: (data: Data) => string = () => 'Failed to parse'
): Promise<Type> {
  const result = await schema.safeParseAsync(data);
  if (!result.success) {
    throw new Error(errorMessage(data), {
      cause: result.error.issues.map((issue) => simplifyZodIssue(issue)),
    });
  }
  return result.data;
}

export const zStringOrArray = z
  .string()
  .min(1)
  .or(z.array(z.string().min(1)))
  .transform((value) => ensureArray(value));

export const zStringToDay = z.iso
  .date()
  .or(z.iso.datetime({ offset: true }))
  .transform((value) => parseISO(value));

export const zStringToStartOfDay = zStringToDay.transform((value) =>
  startOfDay(value)
);

export const zStringToEndOfDay = zStringToDay.transform((value) =>
  endOfDay(value)
);

export * from 'zod';
