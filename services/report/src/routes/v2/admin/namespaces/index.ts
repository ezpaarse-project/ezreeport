import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~common/lib/zod';

import authPlugin from '~/plugins/auth';

import * as responses from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as namespaces from '~/models/namespaces';
import {
  BulkNamespace,
  BulkNamespaceResult,
  InputNamespace,
  Namespace,
  NamespaceQueryFilters,
} from '~/models/namespaces/types';

import { NotFoundError } from '~/types/errors';

import membershipRoutes from './memberships';

const SpecificNamespaceParams = z.object({
  id: z.string().min(1)
    .describe('Namespace ID'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all namespaces',
      tags: ['namespaces'],
      querystring: PaginationQuery.and(NamespaceQueryFilters),
      response: {
        [StatusCodes.OK]: PaginationResponse(Namespace),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const {
        page,
        count,
        sort,
        order,
        ...filters
      } = request.query;

      const content = await namespaces.getAllNamespaces(
        filters,
        {
          page,
          count,
          sort,
          order,
        },
      );

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await namespaces.countNamespaces(filters),
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/',
    schema: {
      summary: 'Replace all namespaces',
      tags: ['namespaces'],
      body: z.array(BulkNamespace),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(BulkNamespaceResult),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    handler: async (request, reply) => {
      const content = await namespaces.replaceNamespaces(request.body);

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get specific namespace',
      tags: ['namespaces'],
      params: SpecificNamespaceParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Namespace),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    handler: async (request, reply) => {
      const content = await namespaces.getNamespace(request.params.id);

      if (!content) {
        throw new NotFoundError(`Namespace ${request.params.id} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Upsert specific namespace',
      tags: ['namespaces'],
      params: SpecificNamespaceParams,
      body: InputNamespace,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Namespace),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    handler: async (request, reply) => {
      const doesExists = await namespaces.doesNamespaceExist(request.params.id);

      let namespace;
      if (doesExists) {
        namespace = await namespaces.editNamespace(request.params.id, request.body);
      } else {
        namespace = await namespaces.createNamespace({ id: request.params.id, ...request.body });
      }

      return responses.buildSuccessResponse(namespace, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      summary: 'Delete specific namespace',
      tags: ['namespaces'],
      params: SpecificNamespaceParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.object({ deleted: z.boolean() })),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    handler: async (request, reply) => {
      const doesExists = await namespaces.doesNamespaceExist(request.params.id);
      if (doesExists) {
        await namespaces.deleteNamespace(request.params.id);
      }

      return responses.buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });

  fastify.register(membershipRoutes, { prefix: '/:namespaceId/memberships' });
};

export default router;
