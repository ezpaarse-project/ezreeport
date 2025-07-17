import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin, { restrictNamespaces } from '~/plugins/auth';

import { PaginationQuery } from '~/models/pagination/types';
import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import { Access } from '~/models/access';
import { getAllTasks } from '~/models/tasks';
import { TaskQueryFilters } from '~/models/tasks/types';

import targetRoutes from './tasks';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all targets of all tasks',
      tags: ['task-targets'],
      querystring: PaginationQuery.and(
        TaskQueryFilters.pick({ namespaceId: true })
      ),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.array(z.string())),
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
      const { namespaceId } = request.query;
      const tasks = await getAllTasks({ namespaceId });

      const content = new Set(tasks.flatMap(({ targets }) => targets));

      return buildSuccessResponse(Array.from(content), reply);
    },
  });

  fastify.register(targetRoutes, { prefix: '/:email/tasks' });
};

// oxlint-disable-next-line no-default-exports
export default router;
