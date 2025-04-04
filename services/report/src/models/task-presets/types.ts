import { z, stringToBool } from '@ezreeport/models/lib/zod';
import { ensureArray } from '@ezreeport/models/lib/utils';

import { Filter } from '@ezreeport/models/templates';
import { Recurrence } from '@ezreeport/models/recurrence';
import { TemplateTag } from '~/models/templates/types';

/**
 * Validation for preset include fields
 */
const TaskPresetIncludeFields = z.enum([
  'template.tags',
  'template.hidden',
] as const);

/**
 * Type for preset include fields
 */
export type TaskPresetIncludeFieldsType = z.infer<typeof TaskPresetIncludeFields>;

/**
 * Validation for task preset
 */
export const TaskPreset = z.object({
  id: z.string().min(1).readonly()
    .describe('Preset ID'),

  name: z.string().min(1)
    .describe('Preset name'),

  templateId: z.string().min(1)
    .describe('Template ID'),

  fetchOptions: z.object({
    dateField: z.string().min(1).optional()
      .describe('Default elastic date field to fetch data from'),

    index: z.string().min(1).optional()
      .describe('Default elastic index to fetch data from'),
  }).optional()
    .describe('Options used to fetch data for the report'),

  hidden: z.boolean().default(false).optional()
    .describe('If preset is hidden to normal users'),

  recurrence: Recurrence
    .describe('Preset recurrence'),

  createdAt: z.date().readonly()
    .describe('Creation date'),

  updatedAt: z.date().nullable().readonly()
    .describe('Last update date'),

  // Includes fields

  template: z.object({
    tags: z.array(TemplateTag).optional().readonly()
      .describe('[Includes] Template tags'),

    hidden: z.boolean().optional().readonly()
      .describe('[Includes] If template is hidden to normal users'),
  }).optional().readonly()
    .describe('[Includes] Template referenced by the preset'),
});

/**
 * Type for a task preset
 */
export type TaskPresetType = z.infer<typeof TaskPreset>;

/**
 * Validation for creating/updating a task preset
 */
export const InputTaskPreset = TaskPreset.omit({
  // Stripping readonly properties
  id: true,
  createdAt: true,
  updatedAt: true,
  // Stripping Includes properties
  template: true,
}).strict();

/**
 * Type for creating/updating a task preset
 */
export type InputTaskPresetType = z.infer<typeof InputTaskPreset>;

/**
 * Validation for query filters of a task preset
 */
export const TaskPresetQueryFilters = z.object({
  query: z.string().optional()
    .describe('Query used for searching'),

  templateId: z.string().min(1).optional()
    .describe('ID of template referenced by the preset'),

  hidden: stringToBool.optional()
    .describe('If preset or template is hidden to normal users'),
});

/**
 * Type for query filters of a task preset
 */
export type TaskPresetQueryFiltersType = z.infer<typeof TaskPresetQueryFilters>;

export const TaskPresetQueryInclude = z.object({
  include: TaskPresetIncludeFields.or(z.array(TaskPresetIncludeFields))
    .transform((v) => ensureArray(v)).optional()
    .describe('Fields to include'),
});

/**
 * Validation for additional data provided when creating a task from a preset
 */
export const AdditionalDataForPreset = z.object({
  name: z.string().min(1)
    .describe('Task name'),

  description: z.string()
    .describe('Task description'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID of the task'),

  index: z.string().min(1)
    .describe('Elastic index to fetch data from'),

  targets: z.array(z.string().email()).min(1)
    .describe('Email addresses to send report'),

  filters: z.array(Filter).optional()
    .describe('Global filters used when fetching data'),
}).strict();

/**
 * Type for additional data provided when creating a task from a preset
 */
export type AdditionalDataForPresetType = z.infer<typeof AdditionalDataForPreset>;
