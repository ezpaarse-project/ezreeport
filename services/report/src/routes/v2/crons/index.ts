import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { Cron } from '@ezreeport/models/crons';
import authPlugin from '~/plugins/auth';
import * as responses from '~/routes/v2/responses';

import {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
} from '~/models/rpc/client/crons';

import { NotFoundError } from '~/models/errors';

const SpecificCronParams = z.object({
  name: z.string().min(1)
    .describe('Name of the cron'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all crons',
      tags: ['crons'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.array(Cron)),
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
      const content = await getAllCrons();

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:name',
    schema: {
      summary: 'Get a cron',
      tags: ['crons'],
      params: SpecificCronParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Cron),
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
      const content = await getAllCrons();
      const item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      return responses.buildSuccessResponse(item, reply);
    },
  });

  fastify.route({
    method: 'PATCH',
    url: '/:name',
    schema: {
      summary: 'Update a cron',
      tags: ['crons'],
      params: SpecificCronParams,
      body: z.object({
        running: z.boolean().optional(),
      }),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Cron),
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
      const content = await getAllCrons();
      let item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      if (request.body.running != null && request.body.running !== item.running) {
        if (request.body.running) {
          item = await startCron(item.name);
        } else {
          item = await stopCron(item.name);
        }
      }

      return responses.buildSuccessResponse(item, reply);
    },
  });

  fastify.route({
    method: 'POST',
    url: '/:name',
    schema: {
      summary: 'Force execution of a cron',
      tags: ['crons'],
      params: SpecificCronParams,
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Cron),
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
      const content = await getAllCrons();
      let item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      item = await forceCron(request.params.name);

      return responses.buildSuccessResponse(item, reply);
    },
  });
};

export default router;
