import axios from '../lib/axios';

// Extracted from Prisma
type JsonObject = { [Key in string]?: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = string | number | boolean | JsonObject | JsonArray | null;

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

export interface Template {
  name: string,
  renderer: string,
  pageCount: number,
}

export interface FullTemplate extends Template {
  template: {
    renderer?: string,
    renderOptions?: JsonObject,
    fetchOptions?: JsonObject,
    layouts: Layout[]
  }
}

/**
 * Get all available templates
 *
 * Needs `templates-get` permission
 *
 * @returns All templates' info
 */
export const getAllTemplates = () => axios.$get<Template[]>('/templates');

/**
 * Get template info
 *
 * Needs `templates-get-name(*)` permission
 *
 * @param name Template's name
 *
 * @returns Template info
 */
export const getTemplate = (name: string) => axios.$get<FullTemplate>(`/templates/${name}`);
