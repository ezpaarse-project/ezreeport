import type { FastifyReply } from 'fastify';
import { getReasonPhrase } from 'http-status-codes';

import { z } from '~/lib/zod';

export const BaseResponse = z.object({
  apiVersion: z.number(),

  status: z.object({ code: z.number(), message: z.string() })
    .describe('HTTP Status'),
});

function buildResponse(reply: FastifyReply): z.infer<typeof BaseResponse> {
  return {
    apiVersion: 2,
    status: {
      code: reply.statusCode,
      message: getReasonPhrase(reply.statusCode),
    },
  };
}

export const SuccessResponse = <T extends z.ZodSchema>(
  content: T,
) => BaseResponse.extend({ content });

export function buildSuccessResponse<
  T extends Record<string, unknown> | unknown[],
>(content: T, reply: FastifyReply) {
  return {
    ...buildResponse(reply),
    content,
  };
}

export const SuccessResponseWithMeta = <T extends z.ZodSchema, M extends z.ZodSchema>(
  content: T,
  meta: M,
) => SuccessResponse(content).extend({ meta });

export function buildSuccessResponseWithMeta<
  T extends Record<string, unknown> | unknown[],
  M extends Record<string, unknown>,
>(content: T, meta: M, reply: FastifyReply) {
  return {
    ...buildSuccessResponse(content, reply),
    meta,
  };
}

export const ErrorResponse = BaseResponse.and(
  z.object({
    error: z.object({
      message: z.string(),
      cause: z.any().optional(),
      stack: z.array(z.string()).optional(),
    }).describe('Error details'),
  }),
);

export function buildErrorResponse(
  error: Error,
  reply: FastifyReply,
): z.infer<typeof ErrorResponse> {
  return {
    ...buildResponse(reply),
    error: {
      message: error.message,
      cause: error.cause,
      stack: error.stack?.split('\n'),
    },
  };
}

export const schemas = {
  204: z.null().describe('Success response'),
  400: ErrorResponse.describe('Bad Request'),
  401: ErrorResponse.describe('Unauthorized'),
  403: ErrorResponse.describe('Forbidden'),
  404: ErrorResponse.describe('Not found'),
  409: ErrorResponse.describe('Conflict'),
  500: ErrorResponse.describe('Internal Server Error'),
  503: ErrorResponse.describe('Service Unavailable'),
} as const;
