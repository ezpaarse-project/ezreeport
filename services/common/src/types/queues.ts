import { z } from '../lib/zod';

import { Namespace } from './namespaces';
import { GenerationStatus, ReportPeriod } from './reports';
import { Task } from './tasks';
import { Template } from './templates';

/**
 * Validation for the data used to generate a report
 */
export const GenerationQueueData = z.object({
  jobId: z.string().min(1)
    .describe('Job ID'),

  task: Task
    .describe('Task used to generate report'),

  namespace: Namespace
    .describe('Namespace used to generate report'),

  template: Template
    .describe('Template of task used to generate report'),

  period: ReportPeriod
    .describe('Period used to generate report'),

  origin: z.string().min(1)
    .describe('Origin of the request, can be a user or a service'),

  targets: z.array(z.string().email()).min(1)
    .describe('Targets of the report'),

  writeActivity: z.boolean().or(z.record(z.string(), z.any())).optional()
    .describe('Should write activity to database, if an object is set it will be used as activity data'),

  printDebug: z.boolean().optional()
    .describe('Should print debug information'),
});

/**
 * Type for the data used to generate a report
 */
export type GenerationQueueDataType = z.infer<typeof GenerationQueueData>;

export const GenerationEventData = z.object({
  id: z.string().min(1)
    .describe('Job ID concerned'),

  status: GenerationStatus
    .describe('Job status'),

  progress: z.number().min(0).max(1)
    .describe('Job progress'),

  updatedAt: z.date()
    .describe('Job updated date'),
});

export type GenerationEventDataType = z.infer<typeof GenerationEventData>;

/**
 * Validation for the data used to send a report by mail
 */
export const MailReportQueueData = z.object({
  success: z.boolean()
    .describe('If generation success or not'),

  file: z.string().base64().min(1)
    .describe('File data'),

  filename: z.string().min(1)
    .describe('File name'),

  task: Task
    .describe('Task used to generate report'),

  namespace: Namespace.omit({ fetchLogin: true, fetchOptions: true })
    .describe('Namespace used to generate report'),

  period: ReportPeriod
    .describe('Period used to generate report'),

  targets: z.array(z.string().email()).min(1)
    .describe('Targets of the report'),

  date: z.coerce.date()
    .describe('Date of the report'),

  generationId: z.string().min(1)
    .describe('Generation ID of the report'),
});

/**
 * Type for the data used to send a report by mail
 */
export type MailReportQueueDataType = z.infer<typeof MailReportQueueData>;

/**
 * Validation for the data used to send an error log by mail
 */
export const MailErrorQueueData = z.object({
  env: z.string().min(1)
    .describe('Environment name'),

  error: z.object({
    file: z.string().min(1)
      .describe('File content to store error log'),

    filename: z.string().min(1)
      .describe('File name to store error log'),

    contact: z.string().email().min(1)
      .describe('Contact to send error log to'),
  }),

  date: z.coerce.date()
    .describe('Date of the report'),
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
export const isReportData = (data: MailQueueDataType): data is MailReportQueueDataType => 'success' in data;

/**
 * Type for the data used to send a mail
 */
export type MailQueueDataType = z.infer<typeof MailQueueData>;

/**
 * Validation for a RPC request
 */
export const RPCRequest = z.object({
  method: z.string().min(1)
    .describe('RPC method name'),

  params: z.array(z.any()).min(1)
    .describe('RPC method parameters'),
});

/**
 * Type for a RPC request
 */
export type RPCRequestType = z.infer<typeof RPCRequest>;

/**
 * Validation for a RPC response
 */
export const RPCResponse = z.object({
  result: z.unknown().optional()
    .describe('RPC method result'),

  error: z.string().min(1).optional()
    .describe('RPC method error'),
});

/**
 * Type for a RPC response
 */
export type RPCResponseType = z.infer<typeof RPCResponse>;
