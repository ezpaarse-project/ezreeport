import {
  z,
  stringToEndOfDay,
  stringToStartOfDay,
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
  ReportFiles,
);

/**
 * Type for files of a task
 */
export type ReportFilesOfTaskType = z.infer<typeof ReportFilesOfTask>;

/**
 * Validation for a manual generation
 */
export const InputManualReport = z.object({
  period: z.object({
    start: stringToStartOfDay
      .describe('Start of the period'),

    end: stringToEndOfDay
      .describe('End of the period'),
  }).optional()
    .describe('Period to generate report for, will enable first level of debug'),

  targets: z.array(z.string().email()).min(1).optional()
    .describe('Custom targets to send report to, will enable first level of debug'),

  debug: z.boolean().default(false).optional()
    .describe('Enable second level of debug'),
}).strict();
