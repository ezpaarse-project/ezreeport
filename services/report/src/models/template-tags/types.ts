import { z } from '@ezreeport/models/lib/zod';

import { TemplateTag } from '@ezreeport/models/templates';

/**
 * Validation for creating/updating a tag
 */
export const InputTemplateTag = z.strictObject({
  ...TemplateTag.omit({
    // Stripping readonly properties
    id: true,
  }).shape,
});

/**
 * Type for creating/updating a tag
 */
export type InputTemplateTagType = z.infer<typeof InputTemplateTag>;

/**
 * Validation for query filters of a tag
 */
export const TemplateTagQueryFilters = z.object({
  query: z.string().optional().describe('Query used for searching'),
});

/**
 * Type for query filters of a tag
 */
export type TemplateTagQueryFiltersType = z.infer<
  typeof TemplateTagQueryFilters
>;
