import { client } from '~/lib/fetch';
import { transformCreatedUpdated } from '~/lib/transform';
import {
  apiRequestOptionsToQuery,
  type ApiResponse,
  type ApiResponsePaginated,
  type ApiRequestOptions,
  type ApiDeletedResponse,
  type SdkPaginated,
} from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import type { InputTemplate, RawTemplate, Template } from './types';

type PaginatedTemplates = SdkPaginated<Omit<Template, 'body'>> & { meta: { default: string } };

/**
 * Get all available templates
 *
 * @returns All templates' info
 */
export async function getAllTemplates(
  opts?: ApiRequestOptions,
): Promise<PaginatedTemplates> {
  const {
    content,
    meta: {
      total, count, page, ...meta
    },
  } = await client.fetch<ApiResponsePaginated<Omit<RawTemplate, 'body'>, { default: string }>>(
    '/templates',
    { query: apiRequestOptionsToQuery(opts) },
  );

  return {
    items: content.map(transformCreatedUpdated),
    total,
    count,
    page,
    meta,
  };
}
assignPermission(getAllTemplates, 'GET /templates', true);

/**
 * Get template info
 *
 * @param templateOrId Template or Template's id
 *
 * @returns Template info
 */
export async function getTemplate(
  templateOrId: Omit<Template, 'body'> | string,
): Promise<Template> {
  const id = typeof templateOrId === 'string' ? templateOrId : templateOrId.id;
  if (!id) {
    throw new Error('Template id is required');
  }

  const {
    content,
  } = await client.fetch<ApiResponse<RawTemplate>>(`/templates/${id}`);

  return transformCreatedUpdated(content);
}
assignPermission(getTemplate, 'GET /templates/:id', true);

/**
 * Create a new template
 *
 * @param template Template's data
 *
 * @returns Created template's info
 */
export async function createTemplate(
  template: InputTemplate,
): Promise<Template> {
  const { content } = await client.fetch<ApiResponse<RawTemplate>>(
    '/templates',
    {
      method: 'POST',
      body: template,
    },
  );

  return transformCreatedUpdated(content);
}
assignPermission(createTemplate, 'POST /templates');

/**
 * Update or create a template
 *
 * @param template Template's data **with id**
 *
 * @returns Updated/Created Template's info
 */
export async function upsertTemplate(
  { id, ...template }: InputTemplate & { id: string },
): Promise<Template> {
  const {
    content,
  } = await client.fetch<ApiResponse<RawTemplate>>(
    `/templates/${id}`,
    {
      method: 'PUT',
      body: template,
    },
  );

  return transformCreatedUpdated(content);
}
assignPermission(upsertTemplate, 'PUT /templates/:id');

/**
 * Delete a template
 *
 * @param templateOrId Template or Template's id
 *
 * @returns Whether the template was deleted
 */
export async function deleteTemplate(
  templateOrId: Omit<Template, 'body'> | string,
): Promise<boolean> {
  const id = typeof templateOrId === 'string' ? templateOrId : templateOrId.id;
  if (!id) {
    return false;
  }

  const {
    content,
  } = await client.fetch<ApiDeletedResponse>(
    `/templates/${id}`,
    { method: 'DELETE' },
  );

  return content.deleted;
}
assignPermission(deleteTemplate, 'DELETE /templates/:id');
