import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for event
 */
export const TaskActivity = z.object({
  createdAt: z.date().describe('Creation date'),

  data: z.record(z.string(), z.any()).nullish().describe('Activity data'),

  id: z.string().min(1).describe('Activity ID'),

  message: z.string().min(1).describe('Activity message'),

  taskId: z.string().min(1).describe('Task ID'),

  type: z.string().min(1).describe('Activity type'),
});

/**
 * Type for event
 */
export type TaskActivityType = z.infer<typeof TaskActivity>;
