import { z } from '../lib/zod';

/**
 * Validation for a recurrence
 */
export const Recurrence = z.enum(
  ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIENNIAL', 'YEARLY'] as const,
);

/**
 * Type for a recurrence
 */
export type RecurrenceType = z.infer<typeof Recurrence>;
