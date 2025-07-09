import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { stringToB64 } from '@ezreeport/models/lib/utils';
import * as responses from '~/routes/v2/responses';
import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as tasks from '~/models/tasks';
import { Task } from '~/models/tasks/types';
import { NotFoundError, ArgumentError } from '~/models/errors';

const SpecificEmailParams = z.object({
  email: z.email().min(1)
    .describe('Email of the target'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get tasks of a target',
      tags: ['task-targets'],
      params: SpecificEmailParams,
      querystring: PaginationQuery,
      response: {
        [StatusCodes.OK]: PaginationResponse(Task),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const filter = { targets: [request.params.email] };
      const content = await tasks.getAllTasks(filter);

      return buildPaginatedResponse(
        content,
        {
          page: request.query.page,
          total: await tasks.countTasks(filter),
          count: content.length,
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id/_unsubscribe',
    schema: {
      summary: 'Get unsubscribe id for a task',
      tags: ['task-targets'],
      params: SpecificEmailParams.and(
        z.object({ id: z.string().min(1) }),
      ),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.object({ id: z.string() })),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const { email, id } = request.params;

      const item = await tasks.getTask(id);
      if (!item) {
        throw new NotFoundError(`Task ${id} not found`);
      }

      const hasEmail = item.targets.some((e: string) => e === email);
      if (!hasEmail) {
        throw new ArgumentError('You don\'t have access to the provided task');
      }

      const taskId64 = stringToB64(item.id);
      const to64 = stringToB64(email);
      const unsubId = encodeURIComponent(`${taskId64}:${to64}`);

      return responses.buildSuccessResponse(
        { id: unsubId },
        reply,
      );
    },
  });
};

export default router;
