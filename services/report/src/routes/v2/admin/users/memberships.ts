import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import * as responses from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as memberships from '~/models/memberships';
import { InputMembership, Membership } from '~/models/memberships/types';

import { NotFoundError } from '~/models/errors';

const SpecificMembershipParams = z.object({
  username: z.string().min(1)
    .describe('Username'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all membership of user',
      tags: ['memberships'],
      querystring: PaginationQuery,
      params: z.object({
        username: z.string().min(1)
          .describe('Username'),
      }),
      response: {
        [StatusCodes.OK]: PaginationResponse(Membership),
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
      const content = await memberships.getAllMemberships(request.params, request.query);

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await memberships.countMemberships(),
          count: content.length,
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:namespaceId',
    schema: {
      summary: 'Get specific membership',
      tags: ['memberships'],
      params: SpecificMembershipParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Membership),
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
      const content = await memberships.getMembership(request.params);

      if (!content) {
        throw new NotFoundError(`Membership for ${request.params.namespaceId} and ${request.params.username} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:namespaceId',
    schema: {
      summary: 'Upsert specific membership',
      tags: ['memberships'],
      params: SpecificMembershipParams,
      body: InputMembership,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Membership),
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
      const doesExists = await memberships.doesMembershipExist(request.params);

      let membership;
      if (doesExists) {
        membership = await memberships.editMembership(request.params, request.body);
      } else {
        membership = await memberships.createMembership({ ...request.params, ...request.body });
      }

      return responses.buildSuccessResponse(membership, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:namespaceId',
    schema: {
      summary: 'Delete specific membership',
      tags: ['memberships'],
      params: SpecificMembershipParams,
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
      const doesExists = await memberships.doesMembershipExist(request.params);
      if (doesExists) {
        await memberships.deleteMembership(request.params);
      }

      return responses.buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });
};

export default router;
