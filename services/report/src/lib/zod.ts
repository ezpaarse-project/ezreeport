import { z } from 'zod';

import { endOfDay, startOfDay } from '~/lib/date-fns';

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

export const stringToArray = z.array(z.string().min(1)).or(
  z.string().transform((v) => {
    if (!v) {
      return [];
    }
    return v.split(',');
  }),
);

export const stringToStartOfDay = z.string().date().transform((v) => {
  const date = z.coerce.date().parse(v);
  return startOfDay(date);
});

export const stringToEndOfDay = z.string().date().transform((v) => {
  const date = z.coerce.date().parse(v);
  return endOfDay(date);
});

export * from 'zod';