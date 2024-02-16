import type { FastifyPluginAsync } from 'fastify';

import authPlugin from '~/plugins/auth';

import { Access } from '~/models/access';
import * as tActivity from '~/models/tasksActivity';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'tasks-activity' });

  /**
   * List all history entries.
   */
  fastify.get<{
    Querystring: tActivity.TaskActivityPaginationQueryType
  }>(
    '/',
    {
      schema: {
        querystring: tActivity.TaskActivityPaginationQuery,
      },
      ezrAuth: {
        access: Access.READ,
      },
    },
    async (request) => {
      const pagination = {
        count: request.query.count ?? 15,
        sort: (request.query.sort ?? 'createdAt'),
        previous: request.query.previous ?? undefined,
      };

      const list = await tActivity.getAllTaskActivityEntries(
        pagination,
        request.namespaceIds,
      );

      return {
        content: list,
        meta: {
          total: await tActivity.getCountTaskActivity(request.namespaceIds),
          count: list.length,
          size: pagination.count,
          lastId: list.at(-1)?.id,
        },
      };
    },
  );
};

export default router;
