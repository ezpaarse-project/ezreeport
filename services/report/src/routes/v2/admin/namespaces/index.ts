import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin from '~/plugins/auth';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';

import * as namespaces from '~/models/namespaces';
import {
  BulkNamespace,
  BulkNamespaceResult,
  InputNamespace,
  Namespace,
  NamespaceQueryFilters,
} from '~/models/namespaces/types';

import { NotFoundError } from '~/models/errors';

import membershipRoutes from './memberships';

const SpecificNamespaceParams = z.object({
  id: z.string().min(1).describe('Namespace ID'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all namespaces',
      tags: ['namespaces'],
      querystring: z.object({
        ...PaginationQuery.shape,
        ...NamespaceQueryFilters.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(Namespace),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, ...filters } = request.query;

      const content = await namespaces.getAllNamespaces(filters, {
        page,
        count,
        sort,
        order,
      });

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await namespaces.countNamespaces(filters),
          count: content.length,
        },
        reply
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(BulkNamespaceResult),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await namespaces.replaceNamespaces(request.body);

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Namespace),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await namespaces.getNamespace(request.params.id);

      if (!content) {
        throw new NotFoundError(`Namespace ${request.params.id} not found`);
      }

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Namespace),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await namespaces.doesNamespaceExist(request.params.id);

      let namespace;
      if (doesExists) {
        namespace = await namespaces.editNamespace(
          request.params.id,
          request.body
        );
      } else {
        namespace = await namespaces.createNamespace({
          id: request.params.id,
          ...request.body,
        });
      }

      return buildSuccessResponse(namespace, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.object({ deleted: z.boolean() })),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await namespaces.doesNamespaceExist(request.params.id);
      if (doesExists) {
        await namespaces.deleteNamespace(request.params.id);
      }

      return buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });

  fastify.register(membershipRoutes, { prefix: '/:namespaceId/memberships' });
};

// oxlint-disable-next-line no-default-exports
export default router;
