import {
  z,
  stringToStartOfDay,
  stringToEndOfDay,
  stringToArray,
} from '~/lib/zod';

import { TaskTemplateBody, TemplateTag } from '~/models/templates/types';
import { Recurrence } from '~/models/recurrence/types';

/**
 * Validation for the last extended template
 */
const LastExtended = z.object({
  id: z.string().min(1)
    .describe('Template ID'),

  name: z.string().min(1)
    .describe('Template name'),

  tags: z.array(TemplateTag).optional()
    .describe('Template tags'),
});

/**
 * Validation with a task
 */
export const Task = z.object({
  id: z.string().min(1).readonly()
    .describe('Task ID'),

  name: z.string().min(1)
    .describe('Task name'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID of the task'),

  extendedId: z.string().min(1)
    .describe('Extended template ID'),

  template: TaskTemplateBody
    .describe('Options to extend template'),

  lastExtended: LastExtended.nullish()
    .describe('Last extended template'),

  targets: z.array(z.string().email()).min(1)
    .describe('Email addresses to send report'),

  recurrence: Recurrence
    .describe('Task recurrence'),

  nextRun: z.coerce.date()
    .describe('Next run date, must be in the future'),

  lastRun: z.date().nullable()
    .describe('Last run date'),

  enabled: z.boolean()
    .describe('Is task enabled, default to true'),

  createdAt: z.date().readonly()
    .describe('Creation date'),

  updatedAt: z.date().nullable().readonly()
    .describe('Last update date'),
});

/**
 * Type for a task
 */
export type TaskType = z.infer<typeof Task>;

/**
 * Validation for creating/updating a task
 */
export const InputTask = Task.omit({
  // Stripping readonly properties
  id: true,
  createdAt: true,
  updatedAt: true,
  // Stripping api reserved properties
  lastRun: true,
}).strict();

/**
 * Type for creating/updating a task
 */
export type InputTaskType = z.infer<typeof InputTask>;

/**
 * Validation for query filters of a task
 */
export const TaskQueryFilters = z.object({
  query: z.string().optional()
    .describe('Query used for searching'),

  extendedId: z.string().min(1).optional()
    .describe('ID of template extended by the task'),

  namespaceId: stringToArray.optional()
    .describe('Possible namespace ID of the task'),

  targets: stringToArray.optional()
    .describe('Email addresses used by the task'),

  'nextRun.from': stringToStartOfDay.optional()
    .describe('Minimum date of next run of the task'),

  'nextRun.to': stringToEndOfDay.optional()
    .describe('Maximum date of next run of the task'),
});

/**
 * Type for query filters of a task
 */
export type TaskQueryFiltersType = z.infer<typeof TaskQueryFilters>;
