import { ensureArray } from '@ezreeport/models/lib/utils';
import { TaskActivity as CommonTaskActivity } from '@ezreeport/models/task-activity';
import {
  z,
  zStringOrArray,
  zStringToStartOfDay,
  zStringToEndOfDay,
} from '@ezreeport/models/lib/zod';

import { Task } from '~/models/tasks/types';

/**
 * Validation for event
 */
export const TaskActivity = z.object().extend({
  ...CommonTaskActivity.shape,

  // Includes fields
  task: Task.omit({ template: true })
    .optional()
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
 * Validation for event include fields
 */
const TaskActivityIncludeFields = z.enum(['task', 'task.namespace'] as const);

/**
 * Type for event include fields
 */
export type TaskActivityIncludeFieldsType = z.infer<
  typeof TaskActivityIncludeFields
>;

/**
 * Validation for query filters of a event
 */
export const TaskActivityQueryFilters = z.object({
  taskId: z.string().min(1).optional().describe('ID of the task'),

  extendedId: z
    .string()
    .min(1)
    .optional()
    .describe('ID of template extended by the task'),

  namespaceId: zStringOrArray
    .optional()
    .describe('Possible namespace ID of the task'),

  'createdAt.from': zStringToStartOfDay
    .optional()
    .describe('Minimum date of event'),

  'createdAt.to': zStringToEndOfDay
    .optional()
    .describe('Maximum date of event'),
});

/**
 * Type for query filters of a event
 */
export type TaskActivityQueryFiltersType = z.infer<
  typeof TaskActivityQueryFilters
>;

/**
 * Validation for event include fields
 */
export const TaskActivityQueryInclude = z.object({
  include: TaskActivityIncludeFields.or(z.array(TaskActivityIncludeFields))
    .transform((value) => ensureArray(value))
    .optional()
    .describe('Fields to include'),
});
