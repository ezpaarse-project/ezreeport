import { z, zStringToBool } from '@ezreeport/models/lib/zod';

import { Template } from '@ezreeport/models/templates';

export * from '@ezreeport/models/templates';

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

  hidden: zStringToBool.optional()
    .describe('If preset or template is hidden to normal users'),
});

/**
 * Type for query filters of a template
 */
export type TemplateQueryFiltersType = z.infer<typeof TemplateQueryFilters>;
