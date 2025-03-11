import {
  z,
  stringToStartOfDay,
  stringToEndOfDay,
  stringOrArray,
  stringToBool,
} from '~/lib/zod';
import { ensureArray } from '~/lib/utils';

import { Namespace } from '~/models/namespaces/types';
import { TaskTemplateBody, TemplateTag } from '~/models/templates/types';
import { Recurrence } from '~/models/recurrence/types';

/**
 * Validation for task include fields
 */
const TaskIncludeFields = z.enum([
  'extends.tags',
  'namespace',
] as const);

/**
 * Type for task include fields
 */
export type TaskIncludeFieldsType = z.infer<typeof TaskIncludeFields>;

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

  description: z.string().optional()
    .describe('Task description'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID of the task'),

  extendedId: z.string().min(1)
    .describe('Extended template ID'),

  template: TaskTemplateBody
    .describe('Options to extend template'),

  lastExtended: LastExtended.nullish()
    .describe('Last extended template'),

  targets: z.array(z.string().email())
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

  // Includes fields

  namespace: Namespace.omit({ fetchLogin: true, fetchOptions: true }).optional().readonly()
    .describe('[Includes] Namespace related to the task'),

  extends: z.object({
    tags: z.array(TemplateTag).optional().readonly()
      .describe('[Includes] Template tags'),
  }).optional().readonly()
    .describe('[Includes] Template extended by the task'),
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
  // Stripping Includes properties
  extends: true,
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

  namespaceId: stringOrArray.optional()
    .describe('Possible namespace ID of the task'),

  targets: stringOrArray.optional()
    .describe('Email addresses used by the task'),

  'nextRun.from': stringToStartOfDay.optional()
    .describe('Minimum date of next run of the task'),

  'nextRun.to': stringToEndOfDay.optional()
    .describe('Maximum date of next run of the task'),

  enabled: stringToBool.optional()
    .describe('If task is enabled'),
});

/**
 * Type for query filters of a task
 */
export type TaskQueryFiltersType = z.infer<typeof TaskQueryFilters>;

/**
 * Validation for task include fields
 */
export const TaskQueryInclude = z.object({
  include: TaskIncludeFields.or(z.array(TaskIncludeFields))
    .transform((v) => ensureArray(v)).optional()
    .describe('Fields to include'),
});
