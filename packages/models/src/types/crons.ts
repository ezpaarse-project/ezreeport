import { z } from '../lib/zod';

/**
 * Validation for a cron
 */
export const Cron = z.object({
  name: z.string(),
  running: z.boolean(),
  lastRun: z.coerce.date().optional(),
  nextRun: z.coerce.date().optional(),
});

export type CronType = z.infer<typeof Cron>;
