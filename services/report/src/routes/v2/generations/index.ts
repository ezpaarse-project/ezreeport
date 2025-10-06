import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin, { requireAllowedNamespace } from '~/plugins/auth';
import { Access } from '~/models/access';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';
import { buildPaginatedResponse } from '~/models/pagination';
import {
  PaginationQuery,
  zPaginationResponse,
} from '~/models/pagination/types';

import * as generations from '~/models/generations';
import { Generation, GenerationQueryInclude } from '~/models/generations/types';

import { NotFoundError } from '~/models/errors';
import { getTask } from '~/models/tasks';
import { getNamespace } from '~/models/namespaces';
import { getTemplate } from '~/models/templates';
import { queueGeneration } from '~/models/queues/report/generation';

const SpecificGenerationParams = z.object({
  id: z.string().min(1).describe('ID of the generation'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zPaginationResponse(Generation),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Extract pagination
      const { page, count, sort, order, include } = request.query;

      const content = await generations.getAllGenerations(include, {
        page,
        count,
        sort,
        order,
      });

      return buildPaginatedResponse(
        content,
        {
          page,
          total: await generations.countGenerations(),
          count: content.length,
        },
        reply
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Generation),
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
        const task = await getTask(request.params.id);
        return requireAllowedNamespace(request, task?.namespaceId ?? '');
      },
    ],
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await generations.getGeneration(request.params.id);
      if (!content) {
        throw new NotFoundError(`Generation ${request.params.id} not found`);
      }

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(
          z
            .object({
              id: z.string().describe("Queue's ID"),
            })
            .describe('Info to get progress of generation')
        ),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const generation = await generations.getGeneration(request.params.id);
      if (!generation) {
        throw new NotFoundError(`Generation ${request.params.id} not found`);
      }

      const task = await getTask(generation.taskId);
      if (!task) {
        throw new NotFoundError(`Task ${generation.taskId} not found`);
      }
      const template = await getTemplate(task.extendedId);
      if (!template) {
        throw new NotFoundError(`Template ${task.extendedId} not found`);
      }
      const namespace = await getNamespace(task.namespaceId);
      if (!namespace) {
        throw new NotFoundError(`Namespace ${task.namespaceId} not found`);
      }

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
        createdAt: generation.createdAt,
      });

      return buildSuccessResponse({ id: generation.id }, reply);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
