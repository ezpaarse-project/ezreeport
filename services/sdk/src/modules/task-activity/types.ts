import type { Task, RawTask } from '~/modules/tasks/types';

export interface TaskActivity {
  /** Activity ID */
  id: string;
  /** Task ID */
  taskId: string;
  /** Activity type */
  type: string;
  /** Activity message */
  message: string;
  /** Activity data */
  data: unknown | null;
  /** Creation date */
  createdAt: Date;

  /** Task related to event, must be included when fetching */
  task?: Omit<Task, 'template'>;
}

export interface RawTaskActivity extends Omit<TaskActivity, 'task' | 'createdAt'> {
  createdAt: string;
  task: Omit<RawTask, 'template'>;
}
