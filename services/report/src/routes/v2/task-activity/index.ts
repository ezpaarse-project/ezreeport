import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import authPlugin, { restrictNamespaces } from '~/plugins/auth';
import { Access } from '~/models/access';

import { describeErrors } from '~/routes/v2/responses';

import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';

import * as taskActivity from '~/models/task-activity';
import {
  TaskActivity,
  TaskActivityQueryFilters,
  TaskActivityQueryInclude,
} from '~/models/task-activity/types';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all task activity',
      tags: ['task-activity'],
      querystring: PaginationQuery.and(TaskActivityQueryFilters).and(
        TaskActivityQueryInclude
      ),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(TaskActivity),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
        access: Access.READ,
      },
    },
    preHandler: [
      async (request): Promise<void> => {
        const restrictedIds = await restrictNamespaces(
          request,
          request.query.namespaceId
        );
        request.query.namespaceId = restrictedIds;
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination and filters from query
      const { page, count, sort, order, include, ...filters } = request.query;

      const content = await taskActivity.getAllActivity(filters, include, {
        page,
        count,
        sort,
        order,
      });

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await taskActivity.countActivity(filters),
          count: content.length,
        },
        reply
      );
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
