import { z } from '../lib/zod';
import { TemplateLocale } from './templates';

/**
 * Validation for report period
 */
export const ReportPeriod = z.object({
  end: z.coerce.date().describe('End of the period'),

  start: z.coerce.date().describe('Start of the period'),
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
  debug: z
    .string()
    .optional()
    .describe(
      'File containing debug information about the generation of report'
    ),

  detail: z
    .string()
    .describe('File containing details about the generation of report'),

  report: z.string().optional().describe('File containing the report'),
});

/**
 * Type for files contained in a report
 */
export type ReportFilesType = z.infer<typeof ReportFiles>;

export const ReportErrorTypes = z.enum([
  'TemplateError',
  'FetchError',
  'RenderError',
  'UnknownError',
] as const);

export type ReportErrorTypesType = z.infer<typeof ReportErrorTypes>;

export const ReportTemplateErrorNames = z.enum([
  'VersionMismatchError',
  'MissingIndexError',
  'MultipleMetricsError',
  'MissingParameterError',
  'ParameterFormatError',
  'AggregationInvalid',
  'UnknownError',
] as const);

export type ReportTemplateErrorNamesType = z.infer<
  typeof ReportTemplateErrorNames
>;

export const ReportFetchErrorNames = z.enum([
  'ElasticError',
  'ShardError',
  'NoDataError',
  'UnknownError',
] as const);

export type ReportFetchErrorNamesType = z.infer<typeof ReportFetchErrorNames>;

export const ReportFetchErrorMeta = z
  .object({
    esIndex: z.string().min(1),
    esQuery: z.unknown(),
    figure: z.int().min(0),
    layout: z.int().min(0),
  })
  .partial();

export type ReportFetchErrorMetaType = z.infer<typeof ReportFetchErrorMeta>;

export const ReportRenderErrorNames = z.enum([
  'DataTypeError',
  'DataFormatError',
  'VegaError',
  'EmptyDataError',
  'SlotError',
  'UnknownError',
] as const);

export type ReportRenderErrorNamesType = z.infer<typeof ReportRenderErrorNames>;

export const ReportRenderErrorMeta = z
  .object({
    figure: z.int().min(0),
    layout: z.int().min(0),
    vegaSpec: z.unknown(),
  })
  .partial();

export type ReportRenderErrorMetaType = z.infer<typeof ReportRenderErrorMeta>;

export const ReportErrorNames = z.union([
  ReportTemplateErrorNames,
  ReportFetchErrorNames,
  ReportRenderErrorNames,
]);

export type ReportErrorNamesType = z.infer<typeof ReportErrorNames>;

export const ReportErrorMeta = z.union([
  ReportFetchErrorMeta,
  ReportRenderErrorMeta,
]);

export type ReportErrorMetaType = z.infer<typeof ReportErrorMeta>;

export const ReportError = z.object({
  cause: ReportErrorMeta.optional(),
  message: z.string(),
  name: ReportErrorNames,
  stack: z.array(z.string()).optional(),
  type: ReportErrorTypes,
});

export type ReportErrorType = z.infer<typeof ReportError>;

/**
 * Validation for the result of a generation
 */
export const ReportResult = z.object({
  detail: z.object({
    auth: z
      .object({
        elastic: z
          .object({
            username: z
              .string()
              .optional()
              .describe('Username used to access the elasticsearch instance'),
          })
          .optional(),
      })
      .optional()
      .describe('Auth used to generate report'),

    createdAt: z.coerce.date().describe('Creation date of the report'),

    destroyAt: z.coerce
      .date()
      .describe('Date when the report will be destroyed'),

    error: ReportError.optional().describe('Error details'),

    files: ReportFiles.describe('Files'),

    jobId: z.string().min(1).describe('Job ID used to generate the report'),

    locale: TemplateLocale.describe('Locale used when generating report'),

    meta: z.any().optional().describe('Metadata'),

    period: ReportPeriod.describe('Period used to generate report'),

    sendingTo: z
      .array(z.email())
      .optional()
      .describe('Email addresses the report was sent'),

    stats: z
      .object({
        pageCount: z
          .int()
          .min(1)
          .optional()
          .describe('Number of page in the report'),

        size: z.int().min(0).optional().describe('Size of the report'),
      })
      .optional()
      .describe('Stats about the report file'),

    taskId: z.string().min(1).describe('Task ID used to generate the report'),

    took: z.int().min(0).describe('Time taken to generate the report'),
  }),

  success: z.boolean().describe('Was the report successfully generated'),
});

/**
 * Type for the result of a generation
 */
export type ReportResultType = z.infer<typeof ReportResult>;
