import type { TemplateFilter } from '~/modules/templates/types';
import type { TemplateTag } from '~/modules/template-tags/types';
import type {
  TaskRecurrence,
  TaskRecurrenceOffset,
} from '~/modules/tasks/types';

export interface TaskPreset {
  /** Preset ID */
  id: string;
  /** Preset name */
  name: string;
  /** Template ID */
  templateId: string;
  /** Recurrence */
  recurrence: TaskRecurrence;
  /** Recurrence offset */
  recurrenceOffset: TaskRecurrenceOffset;
  /** Options used to fetch data for the report */
  fetchOptions?: {
    /** Default elastic date field to fetch data from */
    dateField?: string;
    /** Global filters used when fetching data */
    filters?: TemplateFilter[];
    /** Default elastic index to fetch data from */
    index?: string;
  };
  /** If preset is hidden */
  hidden?: boolean;
  /** Preset creation date */
  createdAt: Date;
  /** Preset last update date */
  updatedAt?: Date;

  /** Template referenced by the preset, must be included when fetching */
  template?: {
    /** Template tags */
    tags?: TemplateTag[];
    /** If template is hidden */
    hidden?: boolean;
  };
}

/**
 * Task preset in raw format
 */
export interface RawTaskPreset extends Omit<
  TaskPreset,
  'createdAt' | 'updatedAt'
> {
  createdAt: string;
  updatedAt?: string | null;
}

export type InputTaskPreset = Omit<
  TaskPreset,
  'id' | 'createdAt' | 'updatedAt' | 'template'
>;

export interface AdditionalDataForPreset {
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Namespace ID of the task */
  namespaceId: string;
  /** Elastic index to fetch data from */
  index: string;
  /** Email addresses to send report */
  targets: string[];
  /** Global filters used when fetching data */
  filters?: TemplateFilter[];
}
