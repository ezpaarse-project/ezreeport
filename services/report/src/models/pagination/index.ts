import type { FastifyReply } from 'fastify';

import type { PaginationMeta, PaginationType } from '~/models/pagination/types';

import { buildSuccessResponseWithMeta } from '~/routes/v2/responses';

type PaginationOptions = {
  take?: number;
  skip: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
};

export function buildPaginatedRequest(
  pagination?: PaginationType
): PaginationOptions {
  const count = pagination?.count ?? 15;
  const page = pagination?.page || 1;

  let orderBy;
  if (pagination?.sort && pagination?.order) {
    orderBy = { [pagination.sort]: pagination.order };
  }

  return {
    orderBy,
    skip: (page - 1) * count,
    take: count || undefined,
  };
}

export function buildPaginatedResponse<
  Data extends unknown[],
  Meta extends Record<string, unknown> & PaginationMeta,
>(data: Data, meta: Meta, reply: FastifyReply) {
  return buildSuccessResponseWithMeta(data, meta, reply);
}
