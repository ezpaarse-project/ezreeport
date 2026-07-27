import { z } from '../lib/zod';

/**
 * Validation for a cron
 */
export const Cron = z.object({
  lastRun: z.coerce.date().optional(),
  name: z.string(),
  nextRun: z.coerce.date().optional(),
  running: z.boolean(),
});

export type CronType = z.infer<typeof Cron>;
