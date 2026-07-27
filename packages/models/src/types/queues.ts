import { z } from '../lib/zod';
import { Namespace } from './namespaces';
import { ReportPeriod } from './reports';
import { Task } from './tasks';
import { Template, TemplateLocale } from './templates';

/**
 * Validation for the data used to generate a report
 */
export const GenerationQueueData = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  id: z.string().min(1).describe('Job ID'),

  namespace: Namespace.describe('Namespace used to generate report'),

  origin: z
    .string()
    .min(1)
    .describe('Origin of the request, can be a user or a service'),

  period: ReportPeriod.describe('Period used to generate report'),

  printDebug: z.boolean().optional().describe('Should print debug information'),

  targets: z.array(z.email()).describe('Targets of the report'),

  task: Task.describe('Task used to generate report'),

  template: Template.describe('Template of task used to generate report'),

  writeActivity: z
    .boolean()
    .or(z.record(z.string(), z.any()))
    .optional()
    .describe(
      'Should write activity to database, if an object is set it will be used as activity data'
    ),
});

/**
 * Type for the data used to generate a report
 */
export type GenerationQueueDataType = z.infer<typeof GenerationQueueData>;

/**
 * Validation for the data used to send a report by mail
 */
export const MailReportQueueData = z.object({
  date: z.coerce.date().describe('Date of the report'),

  filename: z.string().min(1).describe('File name, used to retrieve file'),

  generationId: z.string().min(1).describe('Generation ID of the report'),

  locale: TemplateLocale.describe('Locale to use when sending report'),

  namespace: Namespace.describe('Namespace used to generate report'),

  period: ReportPeriod.describe('Period used to generate report'),

  success: z.boolean().describe('If generation success or not'),

  targets: z.array(z.email()).describe('Targets of the report'),

  task: Task.describe('Task used to generate report'),
});

/**
 * Type for the data used to send a report by mail
 */
export type MailReportQueueDataType = z.infer<typeof MailReportQueueData>;

/**
 * Validation for the data used to send an error log by mail
 */
export const MailErrorQueueData = z.object({
  date: z.coerce.date().describe('Date of the report'),

  env: z.string().min(1).describe('Environment name'),

  error: z.object({
    contact: z.email().min(1).describe('Contact to send error log to'),

    file: z.string().min(1).describe('File content to store error log'),

    filename: z.string().min(1).describe('File name to store error log'),
  }),
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
