import { parseISO } from 'date-fns';

import axios, { type ApiResponse } from '../lib/axios';

import { parseTask, type RawTask, type Task } from './tasks.base';

interface FetchBaseFilter {
  field: string,
  value?: string | string[]
}
interface FetchRawFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>
}

export type FetchFilter = (FetchBaseFilter | FetchRawFilter) & {
  name: string,
  isNot?: boolean
};

export interface Figure {
  type: string,
  data?: string | unknown[],
  filters?: FetchFilter[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>,
  slots?: number[]
}

export interface Layout {
  figures: Figure[]
}

// Private export
export interface RawTemplate {
  id: string,
  name: string,
  pageCount: number,
  tags: {
    name: string,
    color?: string,
  }[],

  createdAt: string, // Date
  updatedAt?: string // Date
}

export interface Template extends Omit<RawTemplate, 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param template Raw template
 *
 * @returns Parsed template
 */
export const parseTemplate = (template: RawTemplate): Template => ({
  ...template,

  createdAt: parseISO(template.createdAt),
  updatedAt: template.updatedAt ? parseISO(template.updatedAt) : undefined,
});

// Private export
export interface RawFullTemplate extends RawTemplate {
  body: {
    version: number,
    filters?: FetchFilter[],
    index?: string,
    dateField: string,
    layouts: Layout[],
    grid?: {
      cols: number,
      rows: number
    }
  }
  tasks: RawTask[]
}

export interface FullTemplate extends Omit<RawFullTemplate, 'tasks' | 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date,
  tasks: Task[],
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param template Raw full template
 *
 * @returns Parsed template
 */
const parseFullTemplate = (template: RawFullTemplate): FullTemplate => {
  const { body, tasks, ...rawTemplate } = template;

  return {
    ...parseTemplate(rawTemplate),
    tasks: tasks.map(parseTask),
    body,
  };
};

export interface InputTemplate {
  name: FullTemplate['name']
  body: FullTemplate['body']
  tags: FullTemplate['tags']
}

type TemplateListResponse = ApiResponse<Template[]> & { meta: { default: string } };

/**
 * Get all available templates
 *
 * Needs `general.templates-get` permission
 *
 * @returns All templates' info
 */
export const getAllTemplates = async (): Promise<TemplateListResponse> => {
  const { content, ...response } = await axios.$get<RawTemplate[]>('/templates');
  const r = response as typeof response & { meta: { default: string } };

  return {
    ...r,
    content: content.map(parseTemplate),
  };
};

/**
 * Get template info
 *
 * Needs `general.templates-get-template` permission
 *
 * @param templateOrId Template or Template's id
 *
 * @returns Template info
 */
export const getTemplate = async (templateOrId: Template | Template['id']): Promise<ApiResponse<FullTemplate>> => {
  const id = typeof templateOrId === 'string' ? templateOrId : templateOrId.id;
  const { content, ...response } = await axios.$get<RawFullTemplate>(`/templates/${id}`);

  return {
    ...response,
    content: parseFullTemplate(content),
  };
};

/**
 * Create a new template
 *
 * Needs `general.templates-post` permission
 *
 * @param template Template's data
 * @param namespaces
 *
 * @returns Created template's info
 */
export const createTemplate = async (
  template: InputTemplate,
): Promise<ApiResponse<FullTemplate>> => {
  const { content, ...response } = await axios.$post<RawFullTemplate>(
    '/templates',
    template,
  );

  return {
    ...response,
    content: parseFullTemplate(content),
  };
};

/**
 * Update or create a template
 *
 * Needs `general.templates-put-template` permission
 *
 * @param template Template's data **with id**
 * @param namespaces
 *
 * @returns Updated/Created Template's info
 */
export const upsertTemplate = async (
  template: InputTemplate & { id: Template['id'] },
): Promise<ApiResponse<FullTemplate>> => {
  const { id, ...t } = template;

  const { content, ...response } = await axios.$put<RawFullTemplate>(
    `/templates/${id}`,
    t,
  );

  return {
    ...response,
    content: parseFullTemplate(content),
  };
};

/**
 * Delete a template
 *
 * Needs `general.templates-delete-template` permission
 *
 * @param templateOrId Template or Template's id
 * @param namespaces
 */
export const deleteTemplate = async (templateOrId: Template | Template['id']): Promise<void> => {
  const id = typeof templateOrId === 'string' ? templateOrId : templateOrId.id;
  await axios.$delete<RawFullTemplate>(`/templates/${id}`);
};
