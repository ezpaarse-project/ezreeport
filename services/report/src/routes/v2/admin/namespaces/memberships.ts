import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { NotFoundError } from '~/models/errors';
import * as memberships from '~/models/memberships';
import { InputMembership, Membership } from '~/models/memberships/types';
import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';

import {
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

const SpecificMembershipParams = z.object({
  namespaceId: z.string().min(1).describe('Namespace ID'),

  username: z.string().min(1).describe('Username'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      params: z.object({
        namespaceId: z.string().min(1).describe('Namespace ID'),
      }),
      querystring: PaginationQuery,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(Membership),
      },
      summary: 'Get all members of namespace',
      tags: ['memberships'],
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
          count: content.length,
          page: request.query.page,
          total: await memberships.countMemberships({
            namespaceId: request.params.namespaceId,
          }),
        },
        reply
      );
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:username',
    schema: {
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
      summary: 'Get specific membership',
      tags: ['memberships'],
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
    url: '/:username',
    schema: {
      body: InputMembership,
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
      summary: 'Upsert specific membership',
      tags: ['memberships'],
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
    url: '/:username',
    schema: {
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
      summary: 'Delete specific membership',
      tags: ['memberships'],
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

// oxlint-disable-next-line no-default-export
export default router;
