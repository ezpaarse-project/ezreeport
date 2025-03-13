import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~common/lib/zod';

import authPlugin from '~/plugins/auth';

import * as responses from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as users from '~/models/users';
import {
  BulkUser,
  BulkUserResult,
  InputUser,
  User,
  UserQueryFilters,
} from '~/models/users/types';

import { NotFoundError } from '~/types/errors';

import membershipRoutes from './memberships';

const SpecificUserParams = z.object({
  username: z.string().min(1)
    .describe('Username'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all users',
      tags: ['users'],
      querystring: PaginationQuery.and(UserQueryFilters),
      response: {
        [StatusCodes.OK]: PaginationResponse(User),
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

      const content = await users.getAllUsers(
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
          total: await users.countUsers(filters),
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/',
    schema: {
      summary: 'Replace all users',
      tags: ['users'],
      body: z.array(BulkUser),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(BulkUserResult),
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
      const content = await users.replaceUsers(request.body);

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:username',
    schema: {
      summary: 'Get specific user',
      tags: ['users'],
      params: SpecificUserParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(User),
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
      const content = await users.getUser(request.params.username);

      if (!content) {
        throw new NotFoundError(`User ${request.params.username} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:username',
    schema: {
      summary: 'Upsert specific user',
      tags: ['users'],
      params: SpecificUserParams,
      body: InputUser,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(User),
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
      const doesExists = await users.doesUserExist(request.params.username);

      let user;
      if (doesExists) {
        user = await users.editUser(request.params.username, request.body);
      } else {
        user = await users.createUser({ username: request.params.username, ...request.body });
      }

      return responses.buildSuccessResponse(user, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:username',
    schema: {
      summary: 'Delete specific user',
      tags: ['users'],
      params: SpecificUserParams,
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
      const doesExists = await users.doesUserExist(request.params.username);
      if (doesExists) {
        await users.deleteUser(request.params.username);
      }

      return responses.buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });

  fastify.register(membershipRoutes, { prefix: '/:username/memberships' });
};

export default router;
