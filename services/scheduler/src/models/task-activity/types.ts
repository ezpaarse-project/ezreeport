import type { z } from '@ezreeport/models/lib/zod';
import { TaskActivity } from '@ezreeport/models/task-activity';

export * from '@ezreeport/models/task-activity';

/**
 * Validation for creating event
 */
export const InputTaskActivity = TaskActivity.omit({
  // Stripping generated properties
  id: true,
  createdAt: true,
});

/**
 * Type for creating event
 */
export type InputTaskActivityType = z.infer<typeof InputTaskActivity>;
