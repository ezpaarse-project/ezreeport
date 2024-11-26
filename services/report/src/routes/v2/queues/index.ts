import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import authPlugin from '~/plugins/authv2';

import * as responses from '~/routes/v2/responses';

import * as queues from '~/models/queues';
import { QueueName, QueueDescription, InputQueue } from '~/models/queues/types';

import { NotFoundError } from '~/types/errors';

import jobsRoutes from './jobs';

const SpecificQueueParams = z.object({
  name: QueueName
    .describe('Name of the queue'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all queues',
      tags: ['queues'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.array(QueueDescription)),
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
      const content = await queues.getAllQueues();

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:name',
    schema: {
      summary: 'Get one queue',
      tags: ['queues'],
      params: SpecificQueueParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(QueueDescription),
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
      const content = await queues.getAllQueues();
      const item = content.find((queue) => queue.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Queue ${request.params.name} not found`);
      }

      return responses.buildSuccessResponse(item, reply);
    },
  });

  fastify.route({
    method: 'PATCH',
    url: '/:name',
    schema: {
      summary: 'Update a queue',
      tags: ['queues'],
      params: SpecificQueueParams,
      body: InputQueue.partial(),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(QueueDescription),
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
      const content = await queues.getAllQueues();
      let item = content.find((queue) => queue.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Queue ${request.params.name} not found`);
      }

      if (request.body.status && request.body.status !== item.status) {
        item = await queues.toggleQueue(request.params.name);
      }

      return responses.buildSuccessResponse(item, reply);
    },
  });

  fastify.register(jobsRoutes, { prefix: '/:name/jobs' });
};

export default router;
