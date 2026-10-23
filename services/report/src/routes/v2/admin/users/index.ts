import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { NotFoundError } from '~/models/errors';
import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';
import * as users from '~/models/users';
import {
  BulkUser,
  BulkUserResult,
  InputUser,
  User,
  UserQueryFilters,
} from '~/models/users/types';

import { authPlugin } from '~/plugins/auth';
import {
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

import membershipRoutes from './memberships';

const SpecificUserParams = z.object({
  username: z.string().min(1).describe('Username'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: z.object({
        ...PaginationQuery.shape,
        ...UserQueryFilters.shape,
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(User),
      },
      summary: 'Get all users',
      tags: ['users'],
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

      const content = await users.getAllUsers(filters, {
        count,
        order,
        page,
        sort,
      });

      return buildPaginatedResponse(
        content,
        {
          count: content.length,
          page: request.query.page,
          total: await users.countUsers(filters),
        },
        reply
      );
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/',
    schema: {
      body: z.array(BulkUser),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(BulkUserResult),
      },
      summary: 'Replace all users',
      tags: ['users'],
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await users.replaceUsers(request.body);

      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:username',
    schema: {
      params: SpecificUserParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(User),
      },
      summary: 'Get specific user',
      tags: ['users'],
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await users.getUser(request.params.username);

      if (!content) {
        throw new NotFoundError(`User ${request.params.username} not found`);
      }

      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:username',
    schema: {
      body: InputUser,
      params: SpecificUserParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(User),
      },
      summary: 'Upsert specific user',
      tags: ['users'],
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await users.doesUserExist(request.params.username);

      let user;
      if (doesExists) {
        user = await users.editUser(request.params.username, request.body);
      } else {
        user = await users.createUser({
          username: request.params.username,
          ...request.body,
        });
      }

      return buildSuccessResponse(user, reply);
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:username',
    schema: {
      params: SpecificUserParams,
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.object({ deleted: z.boolean() })),
      },
      summary: 'Delete specific user',
      tags: ['users'],
    },
    config: {
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const doesExists = await users.doesUserExist(request.params.username);
      if (doesExists) {
        await users.deleteUser(request.params.username);
      }

      return buildSuccessResponse({ deleted: doesExists }, reply);
    },
  });

  fastify.register(membershipRoutes, { prefix: '/:username/memberships' });
};

// oxlint-disable-next-line no-default-export
export default router;
