import { z } from '../lib/zod';

/**
 * Validation for a recurrence
 */
export const Recurrence = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'BIENNIAL',
  'YEARLY',
] as const);

/**
 * Type for a recurrence
 */
export type RecurrenceType = z.infer<typeof Recurrence>;

/**
 * Validation for a recurrence offset
 */
export const RecurrenceOffset = z.object({
  days: z.number().min(0).optional(),
  months: z.number().min(0).optional(),
});

/**
 * Type for a recurrence offset
 */
export type RecurrenceOffsetType = z.infer<typeof RecurrenceOffset>;
