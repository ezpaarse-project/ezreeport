import type { RawTask, Task } from '../tasks/types';

export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'ABORTED';

export interface Generation {
  id: string;
  taskId: string;
  start: Date;
  end: Date;
  targets: string[];
  origin: string;
  writeActivity: boolean;
  status: GenerationStatus;
  progress?: number;
  took?: number;
  reportId: string;
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;

  /** Task related, must be included when fetching */
  task?: Omit<Task, 'template'>;
}

export interface RawGeneration extends Omit<Generation, 'start' | 'end' | 'createdAt' | 'updatedAt' | 'startedAt' | 'task'> {
  start: string;
  end: string;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string;

  task?: Omit<RawTask, 'template'>;
}
