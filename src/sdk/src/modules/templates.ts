import axios from '../lib/axios';

export interface Figure {
  type: string,
  data?: string | unknown[],
  params: object,
  slots?: number[]
}

export interface Layout {
  data?: unknown
  fetcher?: string,
  fetchOptions?: object,
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
    renderOptions?: object,
    fetchOptions?: object,
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
