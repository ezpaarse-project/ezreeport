import { z } from '@ezreeport/models/lib/zod';
import { ensureArray } from '@ezreeport/models/lib/utils';
import { Generation as CommonGeneration } from '@ezreeport/models/generations';

import { Task } from '~/models/tasks/types';

export const GenerationIncludeFields = z.enum([
  'task',
  'task.namespace',
  'task.extends.tags',
] as const);

export type GenerationIncludeFieldsType = z.infer<
  typeof GenerationIncludeFields
>;

export const Generation = z.object({
  ...CommonGeneration.shape,

  // Includes fields
  task: Task.omit({ template: true })
    .optional()
    .describe('[Includes] Task related to the generation'),
});

export type GenerationType = z.infer<typeof Generation>;

/**
 * Validation for task include fields
 */
export const GenerationQueryInclude = z.object({
  include: GenerationIncludeFields.or(z.array(GenerationIncludeFields))
    .transform((value) => ensureArray(value))
    .optional()
    .describe('Fields to include'),
});

export * from '@ezreeport/models/generations';
