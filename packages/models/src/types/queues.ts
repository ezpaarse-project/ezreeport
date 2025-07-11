import { z } from '../lib/zod';

import { Namespace } from './namespaces';
import { ReportPeriod } from './reports';
import { Task } from './tasks';
import { Template } from './templates';

/**
 * Validation for the data used to generate a report
 */
export const GenerationQueueData = z.object({
  id: z.string().min(1).describe('Job ID'),

  task: Task.describe('Task used to generate report'),

  namespace: Namespace.describe('Namespace used to generate report'),

  template: Template.describe('Template of task used to generate report'),

  period: ReportPeriod.describe('Period used to generate report'),

  origin: z
    .string()
    .min(1)
    .describe('Origin of the request, can be a user or a service'),

  targets: z.array(z.email()).min(1).describe('Targets of the report'),

  writeActivity: z
    .boolean()
    .or(z.record(z.string(), z.any()))
    .optional()
    .describe(
      'Should write activity to database, if an object is set it will be used as activity data'
    ),

  printDebug: z.boolean().optional().describe('Should print debug information'),

  createdAt: z.coerce.date().describe('Creation date'),
});

/**
 * Type for the data used to generate a report
 */
export type GenerationQueueDataType = z.infer<typeof GenerationQueueData>;

/**
 * Validation for the data used to send a report by mail
 */
export const MailReportQueueData = z.object({
  success: z.boolean().describe('If generation success or not'),

  filename: z.string().min(1).describe('File name, used to retrieve file'),

  task: Task.describe('Task used to generate report'),

  namespace: Namespace.describe('Namespace used to generate report'),

  period: ReportPeriod.describe('Period used to generate report'),

  targets: z.array(z.email()).min(1).describe('Targets of the report'),

  date: z.coerce.date().describe('Date of the report'),

  generationId: z.string().min(1).describe('Generation ID of the report'),
});

/**
 * Type for the data used to send a report by mail
 */
export type MailReportQueueDataType = z.infer<typeof MailReportQueueData>;

/**
 * Validation for the data used to send an error log by mail
 */
export const MailErrorQueueData = z.object({
  env: z.string().min(1).describe('Environment name'),

  error: z.object({
    file: z.string().min(1).describe('File content to store error log'),

    filename: z.string().min(1).describe('File name to store error log'),

    contact: z.email().min(1).describe('Contact to send error log to'),
  }),

  date: z.coerce.date().describe('Date of the report'),
});

/**
 * Type for the data used to send an error log by mail
 */
export type MailErrorQueueDataType = z.infer<typeof MailErrorQueueData>;

/**
 * Validation for the data used to send a mail
 */
export const MailQueueData = MailReportQueueData.or(MailErrorQueueData);

/**
 * Type guard for the data used to send a mail
 */
export const isReportData = (
  data: MailQueueDataType
): data is MailReportQueueDataType => 'success' in data;

/**
 * Type for the data used to send a mail
 */
export type MailQueueDataType = z.infer<typeof MailQueueData>;
