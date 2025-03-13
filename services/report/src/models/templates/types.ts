import { z, stringToBool } from '~common/lib/zod';

import { Template } from '~common/types/templates';

export * from '~common/types/templates';

/**
 * Validation for creating/updating a template
 */
export const InputTemplate = Template.omit({
  // Stripping readonly properties
  id: true,
  createdAt: true,
  updatedAt: true,
}).strict();

/**
 * Type for creating/updating a template
 */
export type InputTemplateType = z.infer<typeof InputTemplate>;

/**
 * Validation for query filters of a template
 */
export const TemplateQueryFilters = z.object({
  query: z.string().optional()
    .describe('Query used for searching'),

  hidden: stringToBool.optional()
    .describe('If preset or template is hidden to normal users'),
});

/**
 * Type for query filters of a template
 */
export type TemplateQueryFiltersType = z.infer<typeof TemplateQueryFilters>;
