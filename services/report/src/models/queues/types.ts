import { z } from '~/lib/zod';

import { Task } from '~/models/tasks/types';
import { Recurrence } from '~/models/recurrence/types';
import { ReportPeriod } from '~/models/reports/types';

/**
 * Validation for generation result to send in mail
 *
 * ! Keep in sync with mail service
 */
export const MailReport = z.object({
  success: z.boolean()
    .describe('Is the mail is an error mail or not'),

  file: z.string().base64().min(1)
    .describe('File data'),

  task: z.object({
    id: z.string().min(1)
      .describe('Task ID'),

    name: z.string().min(1)
      .describe('Task name'),

    recurrence: Recurrence
      .describe('Task recurrence'),

    targets: z.array(z.string().email()).min(1)
      .describe('Email addresses to send report'),
  }),

  namespace: z.object({
    id: z.string().min(1)
      .describe('Namespace ID'),

    name: z.string().min(1)
      .describe('Namespace name'),

    logo: z.string().min(1).optional()
      .describe('Namespace logo'),
  }),

  contact: z.string().email().optional()
    .describe('The email of the user that was used for generation'),

  date: z.string().date()
    .describe('Date of generation'),

  url: z.string().min(1)
    .describe('URL of the report'),

  generationId: z.string().min(1)
    .describe('ID of the job that generated the report'),
});

/**
 * Type for generation result
 */
export type MailReportType = z.infer<typeof MailReport>;

/**
 * Validation for generation data
 */
export const GenerationData = z.object({
  task: Task.omit({ template: true })
    .describe('Task to generate report for'),

  origin: z.string().min(1)
    .describe('Origin of the request'),

  shouldWriteActivity: z.boolean().optional()
    .describe('Should write activity to database'),

  period: ReportPeriod.optional()
    .describe('Override period of task, enable first level of debug'),

  debug: z.boolean().default(false).optional()
    .describe('Enable second level of debug'),
});

/**
 * Type for generation data
 */
export type GenerationDataType = z.infer<typeof GenerationData>;

/**
 * Validation for mail error data
 *
 * ! Keep in sync with mail service
 */
export const MailErrorData = z.object({
  file: z.string().min(1)
    .describe('File content to store error log'),

  filename: z.string().min(1)
    .describe('File name to store error log'),

  contact: z.string().min(1)
    .describe('Contact to send error log to'),
});

/**
 * Type for mail error data
 */
export type MailErrorDataType = z.infer<typeof MailErrorData>;

/**
 * Validation for mail data
 *
 * ! Keep in sync with mail service
 */
export const MailError = z.object({
  env: z.string().min(1)
    .describe('Environment'),

  error: MailErrorData
    .describe('Error data'),

  date: z.string().date()
    .describe('Date of the error'),
});

/**
 * Type for mail data
 */
export type MailErrorType = z.infer<typeof MailError>;

/**
 * Validation for queue data
 */
export const QueueData = z.object({
  generation: GenerationData,
  mail: MailReport.or(MailError),
});

/**
 * Type for queue data
 */
export type QueueDataType = z.infer<typeof QueueData>;

/**
 * Validation for queue names
 */
export const QueueName = z.enum(['generation', 'mail'] as const);

/**
 * Type for queue names
 */
export type QueueNameType = z.infer<typeof QueueName>;

/**
 * Validation for queue description
 */
export const QueueDescription = z.object({
  name: QueueName.readonly()
    .describe('Queue name'),

  status: z.enum(['active', 'paused'] as const)
    .describe('Queue status'),
});

/**
 * Type for queue description
 */
export type QueueDescriptionType = z.infer<typeof QueueDescription>;

/**
 * Validation for editing queue
 */
export const InputQueue = QueueDescription.omit({
  // Strip readonly fields
  name: true,
}).strict();

/**
 * Type for editing queue
 */
export type InputQueueType = z.infer<typeof InputQueue>;

/**
 * Validation for formatted job
 */
export const FormattedJob = z.object({
  id: z.string().min(1)
    .describe('Job ID'),

  data: z.any()
    .describe('Job data'),

  result: z.any().optional()
    .describe('Job result'),

  progress: z.number().optional()
    .describe('Job progress'),

  added: z.date()
    .describe('Job added date'),

  started: z.date().optional()
    .describe('Job started date'),

  ended: z.date().optional()
    .describe('Job ended date'),

  attempts: z.number()
    .describe('Job attempts'),

  status: z.string()
    .describe('Job status'),
});

/**
 * Type for formatted job
 */
export type FormattedJobType = z.infer<typeof FormattedJob>;
