import { z } from '../lib/zod';

export const GenerationStatus = z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'ERROR', 'ABORTED'] as const);

export type GenerationStatusType = z.infer<typeof GenerationStatus>;

/**
 * Validation for a generation
 */
export const Generation = z.object({
  id: z.string().min(1)
    .describe('Job ID'),

  taskId: z.string().min(1)
    .describe('Task ID'),

  start: z.coerce.date()
    .describe('Start of the period'),

  end: z.coerce.date()
    .describe('End of the period'),

  targets: z.array(z.string().email()).min(1)
    .describe('Targets of the report'),

  origin: z.string().min(1)
    .describe('Origin of the request, can be a user or a service'),

  writeActivity: z.boolean()
    .describe('Should write activity to database'),

  status: GenerationStatus
    .describe('Job status'),

  progress: z.number().int().min(0).max(100)
    .or(z.null())
    .describe('Job progress, null if not started'),

  took: z.number().int().min(0)
    .or(z.null())
    .describe('Time taken to generate the report, null if not started'),

  reportId: z.string()
    .describe('Report ID'),

  createdAt: z.coerce.date().readonly()
    .describe('Creation date'),

  updatedAt: z.coerce.date().nullable().readonly()
    .describe('Last update date'),

  startedAt: z.coerce.date().readonly().nullable()
    .describe('Creation date'),
});

/**
 * Type for a generation
 */
export type GenerationType = z.infer<typeof Generation>;
