import { z } from '@ezreeport/models/lib/zod';
import { ensureArray } from '@ezreeport/models/lib/utils';

import {
  Template as CommonTemplate,
  TemplateTag,
} from '@ezreeport/models/templates';

export * from '@ezreeport/models/templates';

/**
 * Validation for template include fields
 */
const TemplateIncludeFields = z.enum(['tags'] as const);

/**
 * Type for template include fields
 */
export type TemplateIncludeFieldsType = z.infer<typeof TemplateIncludeFields>;

/**
 * Validation with a template
 */
export const Template = z.object({
  ...CommonTemplate.shape,

  // Includes fields
  tags: z
    .array(TemplateTag)
    .optional()
    .describe('[Includes] Tags of the template'),
});

/**
 * Type for a template
 */
export type TemplateType = z.infer<typeof Template>;

/**
 * Validation for creating/updating a template
 */
export const InputTemplate = z.strictObject({
  ...CommonTemplate.omit({
    // Stripping readonly properties
    id: true,
    createdAt: true,
    updatedAt: true,
  }).shape,
  // Allow creation of tags when creating template
  tags: z.array(
    z.strictObject({
      ...TemplateTag.shape,
      id: TemplateTag.shape.id.optional(),
    })
  ),
});

/**
 * Type for creating/updating a template
 */
export type InputTemplateType = z.infer<typeof InputTemplate>;

/**
 * Validation for query filters of a template
 */
export const TemplateQueryFilters = z.object({
  query: z.string().optional().describe('Query used for searching'),

  hidden: z
    .stringbool()
    .optional()
    .describe('If preset or template is hidden to normal users'),
});

/**
 * Type for query filters of a template
 */
export type TemplateQueryFiltersType = z.infer<typeof TemplateQueryFilters>;

/**
 * Validation for template include fields
 */
export const TemplateQueryInclude = z.object({
  include: TemplateIncludeFields.or(z.array(TemplateIncludeFields))
    .transform((value) => ensureArray(value))
    .optional()
    .describe('Fields to include'),
});
