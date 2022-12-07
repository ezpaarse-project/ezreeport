import axios from '../lib/axios';

interface Template {
  name: string,
  renderer: string,
  pageCount: number,
}

interface FullTemplate extends Template {
  template: {
    renderer?: string,
    renderOptions?: object,
    fetchOptions?: object,
    layouts: {
      data?: unknown
      fetcher?: string,
      fetchOptions?: object,
      figures: {
        type: string,
        data: string | unknown[],
        params: object,
        slots?: number[]
      }[]
    }[]
  }
}

/**
 * Get all available templates
 *
 * Needs `templates-get` permission
 *
 * @returns All templates' info
 */
export const getAllTemplates = () => axios.$get<Template>('/templates');

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
