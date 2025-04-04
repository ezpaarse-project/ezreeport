import { z } from '../lib/zod';

/**
 * Validation for report period
 */
export const ReportPeriod = z.object({
  start: z.coerce.date()
    .describe('Start of the period'),

  end: z.coerce.date()
    .describe('End of the period'),
});

/**
 * Type for report period
 */
export type ReportPeriodType = z.infer<typeof ReportPeriod>;

/**
 * Validation for report types
 */
export const ReportType = z.enum(['rep', 'det', 'deb'] as const);

/**
 * Validation for files contained in a report
 */
export const ReportFiles = z.object({
  detail: z.string()
    .describe('File containing details about the generation of report'),

  debug: z.string().optional()
    .describe('File containing debug information about the generation of report'),

  report: z.string().optional()
    .describe('File containing the report'),
});

/**
 * Type for files contained in a report
 */
export type ReportFilesType = z.infer<typeof ReportFiles>;

/**
 * Validation for the cause of a generation error
 */
export const ReportErrorCause = z.object({
  type: z.enum(['fetch', 'render', 'unknown']).optional()
    .describe('Where the error occurred'),

  layout: z.number().int().optional()
    .describe('Layout number where error occurred'),

  figure: z.number().int().or(z.string()).optional()
    .describe('Figure number where error occurred'),

  elasticQuery: z.unknown().optional()
    .describe('Elastic query that failed'),

  elasticData: z.unknown().optional()
    .describe('Elastic data that failed'),

  elasticCount: z.number().optional()
    .describe('Number of elastic results before failure'),

  vegaSpec: z.unknown().optional()
    .describe('Vega spec that failed'),
});

/**
 * Validation for the result of a generation
 */
export const ReportResult = z.object({
  success: z.boolean()
    .describe('Was the report successfully generated'),

  detail: z.object({
    createdAt: z.coerce.date()
      .describe('Creation date of the report'),

    destroyAt: z.coerce.date()
      .describe('Date when the report will be destroyed'),

    took: z.number()
      .describe('Time taken to generate the report'),

    jobId: z.string().min(1)
      .describe('Job ID used to generate the report'),

    taskId: z.string().min(1)
      .describe('Task ID used to generate the report'),

    files: ReportFiles
      .describe('Files'),

    sendingTo: z.array(z.string().email()).optional()
      .describe('Email addresses the report was sent'),

    period: ReportPeriod
      .describe('Period used to generate report'),

    auth: z.object({
      elastic: z.object({
        username: z.string().optional()
          .describe('Username used to access the elasticsearch instance'),
      }).optional(),
    }).optional()
      .describe('Auth used to generate report'),

    stats: z.object({
      pageCount: z.number().optional()
        .describe('Number of page in the report'),

      size: z.number().optional()
        .describe('Size of the report'),
    }).optional()
      .describe('Stats about the report file'),

    error: z.object({
      message: z.string().optional()
        .describe('Error message'),

      stack: z.array(z.string()).optional()
        .describe('Error stack'),

      cause: ReportErrorCause.optional()
        .describe('Cause of the error'),
    }).optional()
      .describe('Error details'),

    meta: z.any().optional()
      .describe('Meta data'),
  }),
});

/**
 * Type for the result of a generation
 */
export type ReportResultType = z.infer<typeof ReportResult>;
