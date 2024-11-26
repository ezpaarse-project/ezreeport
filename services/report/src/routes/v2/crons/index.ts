import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import * as responses from '~/routes/v2/responses';

import * as crons from '~/models/crons';
import { CronName, CronDescription, InputCron } from '~/models/crons/types';

import { NotFoundError } from '~/types/errors';

const SpecificCronParams = z.object({
  name: CronName
    .describe('Name of the cron'),
});

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all crons',
      tags: ['crons'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.array(CronDescription)),
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
      const content = await crons.getAllCrons();

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
        [StatusCodes.OK]: responses.SuccessResponse(CronDescription),
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
      const content = await crons.getAllCrons();
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
      body: InputCron.partial(),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(CronDescription),
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
      const content = await crons.getAllCrons();
      let item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      if (request.body.running != null && request.body.running !== item.running) {
        item = await crons.toggleCron(request.params.name);
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
        [StatusCodes.OK]: responses.SuccessResponse(CronDescription),
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
      const content = await crons.getAllCrons();
      let item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      item = await crons.restartCron(request.params.name);

      return responses.buildSuccessResponse(item, reply);
    },
  });
};

export default router;
