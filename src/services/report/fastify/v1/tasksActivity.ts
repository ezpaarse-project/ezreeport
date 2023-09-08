import type { FastifyPluginAsync } from 'fastify';

import authPlugin from '~/fastify/plugins/auth';
import { PaginationQuery, type PaginationQueryType } from '~/fastify/utils/pagination';

import { Access } from '~/models/access';
import * as tActivity from '~/models/tasksActivity';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'history' });

  /**
   * List all history entries.
   */
  fastify.get<{
    Querystring: PaginationQueryType
  }>(
    '/',
    {
      schema: {
        querystring: PaginationQuery,
      },
      config: {
        auth: {
          access: Access.READ,
        },
      },
    },
    async (request) => {
      const { previous, count = 15 } = request.query;

      const list = await tActivity.getAllTaskActivityEntries(
        { count, previous },
        request.namespaceIds,
      );

      return {
        content: list,
        meta: {
          total: await tActivity.getCountTaskActivity(request.namespaceIds),
          count: list.length,
          size: count,
          lastId: list.at(-1)?.id,
        },
      };
    },
  );
};

export default router;
