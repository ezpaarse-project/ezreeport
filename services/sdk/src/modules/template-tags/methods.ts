import { client } from '~/lib/fetch';
import {
  apiRequestOptionsToQuery,
  type ApiResponse,
  type ApiResponsePaginated,
  type ApiRequestOptions,
  type ApiDeletedResponse,
  type SdkPaginated,
} from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import type { InputTemplateTag, TemplateTag } from './types';

type PaginatedTemplateTags = SdkPaginated<TemplateTag> & {
  meta: { default: string };
};

/**
 * Get all available template tags
 *
 * @returns All template tags' info
 */
export async function getAllTemplateTags(
  opts?: ApiRequestOptions & { include?: string[] }
): Promise<PaginatedTemplateTags> {
  const {
    content,
    meta: { total, count, page, ...meta },
  } = await client.fetch<
    ApiResponsePaginated<TemplateTag, { default: string }>
  >('/template-tags', { query: apiRequestOptionsToQuery(opts) });

  return {
    items: content,
    total,
    count,
    page,
    meta,
  };
}
assignPermission(getAllTemplateTags, 'GET /template-tags', true);

/**
 * Get template tag info
 *
 * @param tagOrId Template tag or template tag's id
 *
 * @returns template tag info
 */
export async function getTemplateTag(
  tagOrId: TemplateTag | string,
  include?: string[]
): Promise<TemplateTag> {
  const id = typeof tagOrId === 'string' ? tagOrId : tagOrId.id;
  if (!id) {
    throw new Error('Tag id is required');
  }

  const { content } = await client.fetch<ApiResponse<TemplateTag>>(
    `/template-tags/${id}`,
    {
      query: { include },
    }
  );

  return content;
}
assignPermission(getTemplateTag, 'GET /template-tags/:id', true);

/**
 * Create a new template tag
 *
 * @param tag Template tag's data
 *
 * @returns Created template tag's info
 */
export async function createTemplateTag(
  tag: InputTemplateTag
): Promise<TemplateTag> {
  const { content } = await client.fetch<ApiResponse<TemplateTag>>(
    '/template-tags',
    {
      method: 'POST',
      body: tag,
    }
  );

  return content;
}
assignPermission(createTemplateTag, 'POST /template-tags');

/**
 * Update or create a template tag
 *
 * @param tag Template tag's data **with id**
 *
 * @returns Updated/Created template tag's info
 */
export async function upsertTemplateTag({
  id,
  ...tag
}: InputTemplateTag & { id: string }): Promise<TemplateTag> {
  const { content } = await client.fetch<ApiResponse<TemplateTag>>(
    `/template-tags/${id}`,
    {
      method: 'PUT',
      body: tag,
    }
  );

  return content;
}
assignPermission(upsertTemplateTag, 'PUT /template-tags/:id');

/**
 * Delete a template tag
 *
 * @param tagOrId Template tag or template tag's id
 *
 * @returns Whether the template tag was deleted
 */
export async function deleteTemplateTag(
  tagOrId: TemplateTag | string
): Promise<boolean> {
  const id = typeof tagOrId === 'string' ? tagOrId : tagOrId.id;
  if (!id) {
    return false;
  }

  const { content } = await client.fetch<ApiDeletedResponse>(
    `/template-tags/${id}`,
    { method: 'DELETE' }
  );

  return content.deleted;
}
assignPermission(deleteTemplateTag, 'DELETE /template-tags/:id');
