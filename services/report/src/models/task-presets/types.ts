import { z } from '~/lib/zod';

import { Recurrence } from '~/models/recurrence/types';

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

  hidden: z.coerce.boolean().optional()
    .describe('If preset or template is hidden to normal users'),
});

/**
 * Type for query filters of a task preset
 */
export type TaskPresetQueryFiltersType = z.infer<typeof TaskPresetQueryFilters>;

/**
 * Validation for additional data provided when creating a task from a preset
 */
export const AdditionalDataForPreset = z.object({
  name: z.string().min(1)
    .describe('Task name'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID of the task'),

  index: z.string().min(1)
    .describe('Elastic index to fetch data from'),

  targets: z.array(z.string().email()).min(1)
    .describe('Email addresses to send report'),
});

/**
 * Type for additional data provided when creating a task from a preset
 */
export type AdditionalDataForPresetType = z.infer<typeof AdditionalDataForPreset>;
