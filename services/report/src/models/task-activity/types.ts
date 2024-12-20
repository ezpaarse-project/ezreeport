import { ensureArray } from '~/lib/utils';
import {
  z,
  stringOrArray,
  stringToStartOfDay,
  stringToEndOfDay,
} from '~/lib/zod';

import { Task } from '~/models/tasks/types';

/**
 * Validation for event include fields
 */
const TaskActivityIncludeFields = z.enum([
  'task',
  'task.namespace',
] as const);

/**
 * Type for event include fields
 */
export type TaskActivityIncludeFieldsType = z.infer<typeof TaskActivityIncludeFields>;

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

  // Includes fields

  task: Task.omit({ template: true }).optional().readonly()
    .describe('[Includes] Task related to event'),
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
  taskId: z.string().min(1).optional()
    .describe('ID of the task'),

  extendedId: z.string().min(1).optional()
    .describe('ID of template extended by the task'),

  namespaceId: stringOrArray.optional()
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

/**
 * Validation for event include fields
 */
export const TaskActivityQueryInclude = z.object({
  include: TaskActivityIncludeFields.or(z.array(TaskActivityIncludeFields))
    .transform((v) => ensureArray(v)).optional()
    .describe('Fields to include'),
});
