import { parseISO } from 'date-fns';
import { assignPermission } from '~/helpers/permissions/decorator';
import { client } from '~/lib/fetch';
import { transformCreatedUpdated } from '~/lib/transform';
import {
  apiRequestOptionsToQuery,
  type ApiRequestOptions,
  type ApiResponse,
  type ApiResponsePaginated,
  type SdkPaginated,
} from '~/lib/api';

import type { Generation, RawGeneration } from './types';
import { transformTask } from '../tasks/methods';

const transformGeneration = (generation: RawGeneration): Generation => ({
  ...transformCreatedUpdated(generation),
  start: parseISO(generation.start),
  end: parseISO(generation.end),

  task: generation.task ? transformTask(generation.task) : undefined,
});

type PaginatedGenerations = SdkPaginated<Generation>;

export async function getAllGenerations(
  opts?: ApiRequestOptions & { include?: string[] },
): Promise<PaginatedGenerations> {
  const {
    content,
    meta: {
      total, count, page,
    },
  } = await client.fetch<ApiResponsePaginated<RawGeneration>>(
    '/generations',
    {
      query: {
        ...apiRequestOptionsToQuery(opts),
        include: opts?.include,
      },
    },
  );

  return {
    items: content.map(transformGeneration),
    total,
    count,
    page,
  };
}
assignPermission(getAllGenerations, 'GET /generations');

export async function getGeneration(
  generationOrId: Generation | string,
  include?: string[],
): Promise<Generation> {
  const id = typeof generationOrId === 'string' ? generationOrId : generationOrId.id;

  const {
    content,
  } = await client.fetch<ApiResponse<RawGeneration>>(`/generations/${id}`, {
    query: { include },
  });

  return transformGeneration(content);
}
assignPermission(getGeneration, 'GET /generations/:id', true);

export async function restartGeneration(
  generationOrId: Generation | string,
): Promise<{ id: string }> {
  const id = typeof generationOrId === 'string' ? generationOrId : generationOrId.id;

  const {
    content,
  } = await client.fetch<ApiResponse<{ id: string }>>(`/generations/${id}`, {
    method: 'PUT',
  });

  return content;
}
assignPermission(restartGeneration, 'PUT /generations/:id', true);
