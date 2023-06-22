import { parseISO } from 'date-fns';
import axios, { type ApiResponse } from '../lib/axios';
import type { JsonObject } from '../lib/utils';

export interface Figure {
  type: string,
  data?: string | unknown[],
  params: JsonObject,
  slots?: number[]
}

export interface Layout {
  data?: unknown
  fetcher?: string,
  fetchOptions?: JsonObject,
  figures: Figure[]
}

// Private export
export interface RawTemplate {
  name: string,
  renderer: string,
  pageCount: number,
  tags: {
    name: string,
    color?: string,
  }[],

  createdAt: string, // Date
  updatedAt?: string, // Date
}

export interface Template extends Omit<RawTemplate, 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param template Raw template
 *
 * @returns Parsed template
 */
const parseTemplate = (template: RawTemplate): Template => ({
  ...template,

  createdAt: parseISO(template.createdAt),
  updatedAt: template.updatedAt ? parseISO(template.updatedAt) : undefined,
});

// Private export
export interface RawFullTemplate extends RawTemplate {
  body: {
    renderer?: string,
    renderOptions?: JsonObject,
    fetchOptions?: JsonObject,
    layouts: Layout[]
  }
}

export interface FullTemplate extends Omit<RawFullTemplate, 'createdAt' | 'updatedAt'> {
  createdAt: Date,
  updatedAt?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param template Raw full template
 *
 * @returns Parsed template
 */
const parseFullTemplate = (template: RawFullTemplate): FullTemplate => {
  const { body, ...rawTemplate } = template;

  return {
    ...parseTemplate(rawTemplate),
    body,
  };
};

export interface InputTemplate {
  body: FullTemplate['body']
  tags: FullTemplate['tags']
}

/**
 * Get all available templates
 *
 * Needs `general.templates-get` permission
 *
 * @returns All templates' info
 */
export const getAllTemplates = async (): Promise<ApiResponse<Template[]>> => {
  const { content, ...response } = await axios.$get<RawTemplate[]>('/templates');

  return {
    ...response,
    content: content.map(parseTemplate),
  };
};

/**
 * Get template info
 *
 * Needs `general.templates-get-name(*)` permission
 *
 * @param name Template's name
 *
 * @returns Template info
 */
export const getTemplate = async (name: Template['name']): Promise<ApiResponse<FullTemplate>> => {
  const { content, ...response } = await axios.$get<RawFullTemplate>(`/templates/${name}`);

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
 * @deprecated use `upsertTemplate` instead
 *
 * @returns Created template's info
 */
export const createTemplate = async (
  template: InputTemplate & { name: Template['name'] },
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
 * Needs `general.templates-put-name(*)` permission
 *
 * @param id Template's id
 * @param template Template's data
 * @param namespaces
 *
 * @returns Updated/Created Template's info
 */
export const upsertTemplate = async (
  name: Template['name'],
  template: InputTemplate,
): Promise<ApiResponse<FullTemplate>> => {
  const { content, ...response } = await axios.$put<RawFullTemplate>(
    `/templates/${name}`,
    template,
  );

  return {
    ...response,
    content: parseFullTemplate(content),
  };
};

/**
 * Update a template
 *
 * Needs `general.templates-put-name(*)` permission
 *
 * @param id Template's id
 * @param template New Template's data
 * @param namespaces
 *
 * @deprecated use `upsertTemplate` instead
 *
 * @returns Updated Template's info
 */
export const updateTemplate = upsertTemplate;

/**
 * Delete a template
 *
 * Needs `general.templates-delete-name(*)` permission
 *
 * @param id Template's id
 * @param namespaces
 *
 * @returns Deleted Template's info
 */
export const deleteTemplate = async (name: Template['name']): Promise<void> => {
  await axios.$delete<RawFullTemplate>(`/templates/${name}`);
};
