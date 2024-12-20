import type { Namespace, RawNamespace } from '~/modules/namespaces/types';
import type { TemplateBodyLayout, TemplateFilter, TemplateTag } from '~/modules/templates';

export type TaskRecurrence =
 | 'DAILY'
 | 'WEEKLY'
 | 'MONTHLY'
 | 'QUARTERLY'
 | 'BIENNIAL'
 | 'YEARLY';

/**
 * Layout of a task
 */
export interface TaskBodyLayout extends TemplateBodyLayout {
  /** Position where to insert this layout */
  at: number;
}

/**
 * Body of a task, this is the data used for generation
 */
export interface TaskBody {
  /** Task version */
  version?: number;
  /** Elastic index used to create task. */
  index: string;
  /** Date field of index used to generate report */
  dateField?: string;
  /** Global filters used when fetching data */
  filters?: TemplateFilter[];
  /** Layouts used when rendering data, added to the ones from the template. */
  inserts: TaskBodyLayout[];
}

export interface LastExtended {
  /** Old template ID */
  id: string;
  /** Old template name */
  name: string;
  /** Old template tags */
  tags: TemplateTag[];
}

export interface Task {
  /** Task ID */
  id: string;
  /** Task name */
  name: string;
  /** Namespace ID */
  namespaceId: string;
  /** Extended template ID */
  extendedId: string;
  /** Options to extend template */
  template: TaskBody;
  /** Last extended template */
  lastExtended?: LastExtended | null;
  /** Email addresses to send report */
  targets: string[];
  /** Task recurrence */
  recurrence: TaskRecurrence;
  /** Next run date, must be in the future */
  nextRun: Date;
  /** Last run date */
  lastRun?: Date;
  /** If task is enabled */
  enabled: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt?: Date;

  /** Template extended by the task, must be included when fetching */
  extends?: {
    /** Template tags, must be included when fetching */
    tags?: TemplateTag[];
  };
  /** Namespace of the task, must be included when fetching */
  namespace?: Omit<Namespace, 'fetchLogin' | 'fetchOptions'>;
}

/**
 * Task in raw format
 */
export interface RawTask extends Omit<Task, 'nextRun' | 'lastRun' | 'namespace' | 'createdAt' | 'updatedAt'> {
  nextRun: string;
  lastRun?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  namespace?: Omit<RawNamespace, 'fetchLogin' | 'fetchOptions'>;
}

/**
 * Data needed to create/edit a task
 */
export type InputTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'lastRun' | 'extends'>;
