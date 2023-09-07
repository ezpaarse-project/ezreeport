import type { FastifyPluginAsync } from 'fastify';

import authPlugin from '~/fastify/plugins/auth';
import { PaginationQuery, PaginationQueryType } from '~/fastify/utils/pagination';

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
      const { previous: p = undefined, count = '15' } = request.query;
      const c = +count;

      const list = await tActivity.getAllTaskActivityEntries(
        {
          count: c,
          previous: p?.toString(),
        },
        request.namespaceIds,
      );

      return {
        content: list,
        meta: {
          total: await tActivity.getCountTaskActivity(request.namespaceIds),
          count: list.length,
          size: c,
          lastId: list.at(-1)?.id,
        },
      };
    },
  );
};

export default router;
