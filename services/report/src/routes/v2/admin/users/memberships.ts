import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

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

import * as memberships from '~/models/memberships';
import { InputMembership, Membership } from '~/models/memberships/types';

import { NotFoundError } from '~/models/errors';

const SpecificMembershipParams = z.object({
  username: z.string().min(1).describe('Username'),

  namespaceId: z.string().min(1).describe('Namespace ID'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all membership of user',
      tags: ['memberships'],
      querystring: PaginationQuery,
      params: z.object({
        username: z.string().min(1).describe('Username'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(Membership),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await memberships.getAllMemberships(
        request.params,
        request.query
      );

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await memberships.countMemberships(),
          count: content.length,
        },
        reply
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Membership),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await memberships.getMembership(request.params);

      if (!content) {
        throw new NotFoundError(
          `Membership for ${request.params.namespaceId} and ${request.params.username} not found`
        );
      }

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Membership),
      },
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await memberships.doesMembershipExist(request.params);

      let membership;
      if (doesExists) {
        membership = await memberships.editMembership(
          request.params,
          request.body
        );
      } else {
        membership = await memberships.createMembership({
          ...request.params,
          ...request.body,
        });
      }

      return buildSuccessResponse(membership, reply);
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
      const doesExists = await memberships.doesMembershipExist(request.params);
      if (doesExists) {
        await memberships.deleteMembership(request.params);
      }

      return buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
