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
  createdAt: string;
  updatedAt: string;
}

export interface RawGeneration extends Omit<Generation, 'start' | 'end' | 'createdAt' | 'updatedAt'> {
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
}
