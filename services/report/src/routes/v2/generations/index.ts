import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~common/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import * as responses from '~/routes/v2/responses';
import { buildPaginatedResponse } from '~/models/pagination';
import { PaginationQuery, PaginationResponse } from '~/models/pagination/types';

import * as generations from '~/models/generations';
import { Generation, GenerationQueryInclude } from '~/models/generations/types';

import { NotFoundError } from '~/types/errors';
import { getTask } from '~/models/tasks';
import { getNamespace } from '~/models/namespaces';
import { getTemplate } from '~/models/templates';
import { queueGeneration } from '~/models/queues/report/generation';

const SpecificGenerationParams = z.object({
  id: z.string().min(1)
    .describe('ID of the generation'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all generations',
      tags: ['generations'],
      querystring: PaginationQuery.and(GenerationQueryInclude),
      response: {
        [StatusCodes.OK]: PaginationResponse(Generation),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    handler: async (request, reply) => {
      // Extract pagination
      const {
        page,
        count,
        sort,
        order,
        include,
      } = request.query;

      const content = await generations.getAllGenerations(
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
          page,
          total: await generations.countGenerations(),
        },
        reply,
      );
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Get specific generation',
      tags: ['generations'],
      params: SpecificGenerationParams,
      querystring: GenerationQueryInclude,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Generation),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
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
        const task = await getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    handler: async (request, reply) => {
      const content = await generations.getGeneration(request.params.id);
      if (!content) {
        throw new NotFoundError(`Generation ${request.params.id} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Restart specific generation',
      tags: ['generations'],
      params: SpecificGenerationParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(
          z.object({
            id: z.string().describe("Queue's ID"),
          }).describe('Info to get progress of generation'),
        ),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    handler: async (request, reply) => {
      const generation = await generations.getGeneration(request.params.id);
      if (!generation) {
        throw new NotFoundError(`Generation ${request.params.id} not found`);
      }

      const task = await getTask(generation.taskId);
      if (!task) { throw new NotFoundError(`Task ${generation.taskId} not found`); }
      const template = await getTemplate(task.extendedId);
      if (!template) { throw new NotFoundError(`Template ${task.extendedId} not found`); }
      const namespace = await getNamespace(task.namespaceId);
      if (!namespace) { throw new NotFoundError(`Namespace ${task.namespaceId} not found`); }

      await queueGeneration({
        id: generation.id,
        task,
        namespace,
        template,
        period: { start: generation.start, end: generation.end },
        targets: generation.targets,
        origin: request.user?.username ?? generation.origin,
        writeActivity: generation.writeActivity,
        printDebug: false,
      });

      return responses.buildSuccessResponse({ id: generation.id }, reply);
    },
  });
};

export default router;
