import {
  z,
  zStringToEndOfDay,
  zStringToStartOfDay,
} from '@ezreeport/models/lib/zod';

import { ReportFiles } from '@ezreeport/models/reports';

export * from '@ezreeport/models/reports';

/**
 * Type for files contained in a report
 */
export type ReportFilesType = z.infer<typeof ReportFiles>;

/**
 * Validation for files of a task
 */
export const ReportFilesOfTask = z.record(
  z.string().describe('Report ID'),
  ReportFiles
);

/**
 * Type for files of a task
 */
export type ReportFilesOfTaskType = z.infer<typeof ReportFilesOfTask>;

/**
 * Validation for a manual generation
 */
export const InputManualReport = z
  .object({
    period: z
      .object({
        start: zStringToStartOfDay.describe('Start of the period'),

        end: zStringToEndOfDay.describe('End of the period'),
      })
      .optional()
      .describe(
        'Period to generate report for, enable first level of debug if provided'
      ),

    targets: z
      .array(z.email())
      .optional()
      .describe(
        'Custom targets to send report to, enable first level of debug if provided'
      ),

    debug: z
      .boolean()
      .default(false)
      .optional()
      .describe(
        'Enable second level of debug, not available in production environment'
      ),
  })
  .strict();
