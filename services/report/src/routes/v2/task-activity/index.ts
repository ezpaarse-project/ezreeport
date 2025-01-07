import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import authPlugin, { restrictNamespaces } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';
import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as taskActivity from '~/models/task-activity';
import { TaskActivity, TaskActivityQueryFilters, TaskActivityQueryInclude } from '~/models/task-activity/types';

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all task activity',
      tags: ['task-activity'],
      querystring: PaginationQuery.and(TaskActivityQueryFilters).and(TaskActivityQueryInclude),
      response: {
        [StatusCodes.OK]: PaginationResponse(TaskActivity),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    preHandler: [
      async (request) => {
        const restrictedIds = await restrictNamespaces(request, request.query.namespaceId);
        request.query.namespaceId = restrictedIds;
      },
    ],
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const {
        page,
        count,
        sort,
        order,
        include,
        ...filters
      } = request.query;

      const content = await taskActivity.getAllActivity(
        filters,
        include,
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
          total: await taskActivity.countActivity(filters),
        },
        reply,
      );
    },
  });
};

export default router;
