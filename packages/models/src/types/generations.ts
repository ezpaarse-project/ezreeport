import { z } from '../lib/zod';

export const GenerationStatus = z.enum([
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'ERROR',
  'ABORTED',
] as const);

export type GenerationStatusType = z.infer<typeof GenerationStatus>;

/**
 * Validation for a generation
 */
export const Generation = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  end: z.coerce.date().describe('End of the period'),

  id: z.string().min(1).describe('Job ID'),

  origin: z
    .string()
    .min(1)
    .describe('Origin of the request, can be a user or a service'),

  progress: z
    .int()
    .min(0)
    .max(100)
    .or(z.null())
    .describe('Job progress, null if not started'),

  reportId: z.string().describe('Report ID'),

  start: z.coerce.date().describe('Start of the period'),

  startedAt: z.coerce.date().nullable().describe('Creation date'),

  status: GenerationStatus.describe('Job status'),

  targets: z.array(z.email()).describe('Targets of the report'),

  taskId: z.string().min(1).describe('Task ID'),

  took: z
    .int()
    .min(0)
    .or(z.null())
    .describe('Time taken to generate the report, null if not started'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),

  writeActivity: z.boolean().describe('Should write activity to database'),
});

/**
 * Type for a generation
 */
export type GenerationType = z.infer<typeof Generation>;
