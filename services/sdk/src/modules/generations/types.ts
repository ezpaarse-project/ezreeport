import type { RawTask, Task } from '../tasks/types';

export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export interface Generation {
  id: string;
  taskId: string;
  start: Date;
  end: Date;
  targets: string[];
  origin: string;
  writeActivity: boolean;
  status: GenerationStatus;
  progress: number;
  took: number;
  reportId: string;
  createdAt: Date;
  updatedAt: Date;

  /** Task related, must be included when fetching */
  task?: Omit<Task, 'template'>;
}

export interface RawGeneration extends Omit<Generation, 'start' | 'end' | 'createdAt' | 'updatedAt' | 'task'> {
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;

  task?: Omit<RawTask, 'template'>;
}
