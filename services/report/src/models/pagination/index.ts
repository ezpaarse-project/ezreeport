import type { FastifyReply } from 'fastify';

import { buildSuccessResponseWithMeta } from '~/routes/v2/responses';

import type { PaginationType } from '~/models/pagination/types';

export function buildPaginatedRequest(pagination?: PaginationType) {
  const count = pagination?.count ?? 15;
  const page = pagination?.page || 1;

  let orderBy;
  if (pagination?.sort && pagination?.order) {
    orderBy = { [pagination.sort]: pagination.order };
  }

  return {
    take: count || undefined,
    skip: (page - 1) * count,
    orderBy,
  };
}

export function buildPaginatedResponse<
  T extends unknown[],
  M extends Record<string, unknown>,
>(data: T, meta: { total: number, page: number } & M, reply: FastifyReply) {
  return buildSuccessResponseWithMeta(
    data,
    { ...meta, count: data.length },
    reply,
  );
}
