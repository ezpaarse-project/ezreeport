import {
  z,
  stringToArray,
  stringToStartOfDay,
  stringToEndOfDay,
} from '~/lib/zod';

import { Task } from '../tasks/types';

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

  // Includes
  task: Task.nullish(),
});

/**
 * Type for event
 */
export type TaskActivityType = z.infer<typeof TaskActivity>;

/**
 * Validation for creating event
 */
export const InputTaskActivity = TaskActivity.omit({
  // Stripping generated properties
  id: true,
  createdAt: true,
  // Stripping includes
  task: true,
});

/**
 * Type for creating event
 */
export type InputTaskActivityType = z.infer<typeof InputTaskActivity>;

/**
 * Validation for query filters of a event
 */
export const TaskActivityQueryFilters = z.object({
  extendedId: z.string().min(1).optional()
    .describe('ID of template extended by the task'),

  namespaceId: stringToArray.optional()
    .describe('Possible namespace ID of the task'),

  'createdAt.from': stringToStartOfDay.optional()
    .describe('Minimum date of event'),

  'createdAt.to': stringToEndOfDay.optional()
    .describe('Maximum date of event'),
});

/**
 * Type for query filters of a event
 */
export type TaskActivityQueryFiltersType = z.infer<typeof TaskActivityQueryFilters>;
