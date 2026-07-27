import { z } from '../lib/zod';
import { Recurrence, RecurrenceOffset } from './recurrence';
import { TaskTemplateBody, TemplateTag } from './templates';

/**
 * Validation for the last extended template
 */
const LastExtended = z.object({
  id: z.string().min(1).describe('Template ID'),

  name: z.string().min(1).describe('Template name'),

  tags: z
    .array(TemplateTag.pick({ color: true, id: true, name: true }))
    .optional()
    .describe('Template tags'),
});

/**
 * Validation with a task
 */
export const Task = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  description: z.string().optional().describe('Task description'),

  enabled: z.boolean().describe('Is task enabled, default to true'),

  extendedId: z.string().min(1).describe('Extended template ID'),

  id: z.string().min(1).describe('Task ID'),

  lastExtended: LastExtended.nullish().describe('Last extended template'),

  lastRun: z.coerce.date().nullable().describe('Last run date'),

  name: z.string().min(1).describe('Task name'),

  namespaceId: z.string().min(1).describe('Namespace ID of the task'),

  nextRun: z.coerce.date().describe('Next run date, must be in the future'),

  recurrence: Recurrence.describe('Task recurrence'),

  recurrenceOffset: RecurrenceOffset.describe('Task recurrence offset'),

  targets: z.array(z.email()).min(1).describe('Email addresses to send report'),

  template: TaskTemplateBody.describe('Options to extend template'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a task
 */
export type TaskType = z.infer<typeof Task>;
