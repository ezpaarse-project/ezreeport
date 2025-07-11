import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import * as indices from '~/models/indices';
import { Index, Mapping } from '~/models/indices/types';

const SpecificIndexParams = z.object({
  index: z.string().min(1).describe('Index name'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/indices',
    schema: {
      summary: 'List indices (including aliases)',
      tags: ['elastic'],
      querystring: z.object({
        namespaceId: z
          .string()
          .min(1)
          .optional()
          .describe('Restrict to namespace, mandatory if not admin'),

        query: z
          .string()
          .min(1)
          .optional()
          .describe('Index pattern to look for'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.array(Index)),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      (request): Promise<void> =>
        requireAllowedNamespace(request, request.query.namespaceId ?? ''),
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const { namespaceId, query } = request.query;

      return buildSuccessResponse(
        await indices.getAllIndices(namespaceId, query),
        reply
      );
    },
  });

  fastify.route({
    method: 'GET',
    url: '/indices/:index',
    schema: {
      summary: 'Get mapping of an specific index',
      tags: ['elastic'],
      params: SpecificIndexParams,
      querystring: z.object({
        namespaceId: z
          .string()
          .min(1)
          .optional()
          .describe('Restrict to namespace, mandatory if not admin'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Mapping),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      (request): Promise<void> =>
        requireAllowedNamespace(request, request.query.namespaceId ?? ''),
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const { index } = request.params;
      const { namespaceId } = request.query;

      return buildSuccessResponse(
        await indices.getIndex(index, namespaceId),
        reply
      );
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
