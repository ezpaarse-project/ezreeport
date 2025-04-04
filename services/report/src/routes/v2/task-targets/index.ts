import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin, { restrictNamespaces } from '~/plugins/auth';

import * as responses from '~/routes/v2/responses';
import { PaginationQuery } from '~/models/pagination/types';

import { Access } from '~/models/access';
import { getAllTasks } from '~/models/tasks';
import { TaskQueryFilters } from '~/models/tasks/types';

import targetRoutes from './tasks';

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all targets of all tasks',
      tags: ['task-targets'],
      querystring: PaginationQuery.and(TaskQueryFilters.pick({ namespaceId: true })),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.array(z.string())),
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
      const { namespaceId } = request.query;
      const tasks = await getAllTasks({ namespaceId });

      const content = new Set(tasks.flatMap(({ targets }) => targets));

      return responses.buildSuccessResponse(Array.from(content), reply);
    },
  });

  fastify.register(targetRoutes, { prefix: '/:email/tasks' });
};

export default router;
