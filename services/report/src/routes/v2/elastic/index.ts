import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';

import * as indices from '~/models/indices';
import { Index, Mapping } from '~/models/indices/types';

const SpecificIndexParams = z.object({
  index: z.string().min(1)
    .describe('Index name'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/indices',
    schema: {
      summary: 'List indices (including aliases)',
      tags: ['elastic'],
      querystring: z.object({
        namespaceId: z.string().min(1).optional()
          .describe('Restrict to namespace, mandatory if not admin'),

        query: z.string().min(1).optional()
          .describe('Index pattern to look for'),
      }),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.array(Index)),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request) => requireAllowedNamespace(request, request.query.namespaceId ?? ''),
    ],
    handler: async (request, reply) => {
      const { namespaceId, query } = request.query;

      return responses.buildSuccessResponse(
        await indices.getAllIndices(namespaceId, query),
        reply,
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
        namespaceId: z.string().min(1).optional()
          .describe('Restrict to namespace, mandatory if not admin'),
      }),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Mapping),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ_WRITE,
      },
    },
    preHandler: [
      async (request) => requireAllowedNamespace(request, request.query.namespaceId ?? ''),
    ],
    handler: async (request, reply) => {
      const { index } = request.params;
      const { namespaceId } = request.query;

      return responses.buildSuccessResponse(
        await indices.getIndex(index, namespaceId),
        reply,
      );
    },
  });
};

export default router;
