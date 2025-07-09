import {
  z,
  zStringToStartOfDay,
  zStringToEndOfDay,
  zStringOrArray,
} from '@ezreeport/models/lib/zod';
import { ensureArray } from '@ezreeport/models/lib/utils';

import { Task as CommonTask } from '@ezreeport/models/tasks';
import { Namespace } from '~/models/namespaces/types';
import { TemplateTag } from '~/models/templates/types';

export * from '@ezreeport/models/tasks';

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
 * Validation with a task
 */
export const Task = CommonTask.extend({
  // Includes fields
  namespace: Namespace.omit({ fetchLogin: true, fetchOptions: true }).optional()
    .describe('[Includes] Namespace related to the task'),

  extends: z.object({
    tags: z.array(TemplateTag).optional()
      .describe('[Includes] Template tags'),
  }).optional()
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

  namespaceId: zStringOrArray.optional()
    .describe('Possible namespace ID of the task'),

  targets: zStringOrArray.optional()
    .describe('Email addresses used by the task'),

  'nextRun.from': zStringToStartOfDay.optional()
    .describe('Minimum date of next run of the task'),

  'nextRun.to': zStringToEndOfDay.optional()
    .describe('Maximum date of next run of the task'),

  enabled: z.stringbool().optional()
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
