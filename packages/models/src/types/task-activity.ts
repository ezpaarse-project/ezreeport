import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for event
 */
export const TaskActivity = z.object({
  id: z.string().min(1)
    .describe('Activity ID'),

  taskId: z.string().min(1)
    .describe('Task ID'),

  type: z.string().min(1)
    .describe('Activity type'),

  message: z.string().min(1)
    .describe('Activity message'),

  data: z.record(z.any()).nullish()
    .describe('Activity data'),

  createdAt: z.date()
    .describe('Creation date'),
});

/**
 * Type for event
 */
export type TaskActivityType = z.infer<typeof TaskActivity>;
