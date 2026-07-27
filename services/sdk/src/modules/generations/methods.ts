import { parseISO } from 'date-fns';

import {
  type ApiRequestOptions,
  type ApiResponse,
  type ApiResponsePaginated,
  type SdkPaginated,
  apiRequestOptionsToQuery,
} from '~/lib/api';
import { client } from '~/lib/fetch';
import { transformCreatedUpdated } from '~/lib/transform';

import { assignPermission } from '~/helpers/permissions/decorator';

import type { Generation, RawGeneration } from './types';
import { transformTaskWithoutBody } from '../tasks/methods';

export const transformGeneration = (generation: RawGeneration): Generation => ({
  ...transformCreatedUpdated(generation),
  end: parseISO(generation.end),
  start: parseISO(generation.start),
  startedAt: generation.startedAt ? parseISO(generation.startedAt) : undefined,
  task: generation.task ? transformTaskWithoutBody(generation.task) : undefined,
});

type PaginatedGenerations = SdkPaginated<Generation>;

export async function getAllGenerations(
  opts?: ApiRequestOptions & { include?: string[] }
): Promise<PaginatedGenerations> {
  const {
    content,
    meta: { total, count, page },
  } = await client.fetch<ApiResponsePaginated<RawGeneration>>('/generations', {
    query: {
      ...apiRequestOptionsToQuery(opts),
      include: opts?.include,
    },
  });

  return {
    count,
    items: content.map(transformGeneration),
    page,
    total,
  };
}
assignPermission(getAllGenerations, 'GET /generations');

export async function getGeneration(
  generationOrId: Generation | string,
  include?: string[]
): Promise<Generation> {
  const id =
    typeof generationOrId === 'string' ? generationOrId : generationOrId.id;

  const { content } = await client.fetch<ApiResponse<RawGeneration>>(
    `/generations/${id}`,
    {
      query: { include },
    }
  );

  return transformGeneration(content);
}
assignPermission(getGeneration, 'GET /generations/:id', true);

export async function restartGeneration(
  generationOrId: Generation | string
): Promise<{ id: string }> {
  const id =
    typeof generationOrId === 'string' ? generationOrId : generationOrId.id;

  const { content } = await client.fetch<ApiResponse<{ id: string }>>(
    `/generations/${id}`,
    {
      method: 'PUT',
    }
  );

  return content;
}
assignPermission(restartGeneration, 'PUT /generations/:id');
