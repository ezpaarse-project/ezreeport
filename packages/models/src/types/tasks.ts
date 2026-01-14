import { z } from '../lib/zod';

import { TaskTemplateBody, TemplateTag } from './templates';
import { Recurrence, RecurrenceOffset } from './recurrence';

/**
 * Validation for the last extended template
 */
const LastExtended = z.object({
  id: z.string().min(1).describe('Template ID'),

  name: z.string().min(1).describe('Template name'),

  tags: z
    .array(TemplateTag.pick({ id: true, name: true, color: true }))
    .optional()
    .describe('Template tags'),
});

/**
 * Validation with a task
 */
export const Task = z.object({
  id: z.string().min(1).describe('Task ID'),

  name: z.string().min(1).describe('Task name'),

  description: z.string().optional().describe('Task description'),

  namespaceId: z.string().min(1).describe('Namespace ID of the task'),

  extendedId: z.string().min(1).describe('Extended template ID'),

  template: TaskTemplateBody.describe('Options to extend template'),

  lastExtended: LastExtended.nullish().describe('Last extended template'),

  targets: z.array(z.email()).describe('Email addresses to send report'),

  recurrence: Recurrence.describe('Task recurrence'),

  recurrenceOffset: RecurrenceOffset.describe('Task recurrence offset'),

  nextRun: z.coerce.date().describe('Next run date, must be in the future'),

  lastRun: z.coerce.date().nullable().describe('Last run date'),

  enabled: z.boolean().describe('Is task enabled, default to true'),

  createdAt: z.coerce.date().describe('Creation date'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a task
 */
export type TaskType = z.infer<typeof Task>;
