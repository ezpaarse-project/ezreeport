import type { RawReportPeriod, ReportPeriod } from '~/modules/reports/types';
import type { Task, RawTask } from '~/modules/tasks/types';

export interface GenerationData {
  task: Omit<Task, 'namespace' | 'extends'>;
  origin: string;
  shouldWriteActivity?: boolean;
  period?: ReportPeriod;
  debug?: boolean;
}

export interface RawGenerationData extends Omit<GenerationData, 'task' | 'period'> {
  task: Omit<RawTask, 'namespace' | 'extends'>;
  period?: RawReportPeriod;
}

export interface MailData {
  success: boolean;
  task: {
    id: string;
    name: string;
    recurrence: string;
    targets: string[];
  };
  namespace: {
    id: string;
    name: string;
    logo?: string;
  }
  contact?: string;
  date: Date;
  url: string;
  generationId: string;
}

export interface RawMailData extends Omit<MailData, 'date'> {
  date: string;
}

export interface MailError {
  env: string,
  error: {
    file: string,
    filename: string,
    contact: string,
  },
  date: Date,
}

export interface RawMailError extends Omit<MailError, 'date'> {
  date: string;
}

export type JobStatus =
  | 'completed'
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'failed'
  | 'paused'
  | 'stuck';

export interface Job<Data = {}, Result = {}> {
  id: string;
  data: Data;
  result?: Result;
  progress: number;
  added: Date;
  started?: Date;
  ended?: Date;
  attempts: number;
  status: JobStatus;
}

export interface RawJob<Data = {}, Result = {}> extends Omit<Job<Data, Result>, 'added' | 'started' | 'ended'> {
  added: string;
  started?: string;
  ended?: string;
}

export interface Queue {
  name: string;
  status: 'active' | 'paused';
}

export type InputQueue = Omit<Queue, 'name'>;
