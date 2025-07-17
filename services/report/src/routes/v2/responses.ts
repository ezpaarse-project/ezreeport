import type { FastifyReply } from 'fastify';
import type { StatusCodes } from 'http-status-codes';
import { getReasonPhrase } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

export const BaseResponse = z.object({
  apiVersion: z.int().min(1),

  status: z
    .object({ code: z.int(), message: z.string() })
    .describe('HTTP Status'),
});

type BaseResponseType = z.Infer<typeof BaseResponse>;

function buildResponse(reply: FastifyReply): z.infer<typeof BaseResponse> {
  return {
    apiVersion: 2,
    status: {
      code: reply.statusCode,
      message: getReasonPhrase(reply.statusCode),
    },
  };
}

export type SuccessResponseType<Content> = BaseResponseType & {
  content: Content;
};

export const zSuccessResponse = <Content extends z.ZodSchema>(
  content: Content
) => BaseResponse.extend({ content });

export function buildSuccessResponse<
  Content extends Record<string, unknown> | unknown[],
>(content: Content, reply: FastifyReply): SuccessResponseType<Content> {
  return {
    ...buildResponse(reply),
    content,
  };
}

export type SuccessResponseTypeWithMeta<Content, Meta> =
  SuccessResponseType<Content> & {
    meta: Meta;
  };

export const zSuccessResponseWithMeta = <
  Content extends z.ZodSchema,
  Meta extends z.ZodSchema,
>(
  content: Content,
  meta: Meta
) => zSuccessResponse(content).extend({ meta });

export function buildSuccessResponseWithMeta<
  Content extends Record<string, unknown> | unknown[],
  Meta extends Record<string, unknown>,
>(
  content: Content,
  meta: Meta,
  reply: FastifyReply
): SuccessResponseTypeWithMeta<Content, Meta> {
  return {
    ...buildSuccessResponse(content, reply),
    meta,
  };
}

export const ErrorResponse = BaseResponse.and(
  z.object({
    error: z
      .object({
        message: z.string(),
        cause: z.any().optional(),
        stack: z.array(z.string()).optional(),
      })
      .describe('Error details'),
  })
);

export function buildErrorResponse(
  error: Error,
  reply: FastifyReply
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

export const EmptyResponse = z.null().describe('Success response');

export const describeErrors = (
  errors: StatusCodes[]
): Record<StatusCodes, typeof ErrorResponse> =>
  Object.fromEntries(
    errors.map((code) => [code, ErrorResponse.describe(getReasonPhrase(code))])
  ) as Record<StatusCodes, typeof ErrorResponse>;

/**
 * @deprecated Use `describeErrors` and `Empty Response`
 */
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
