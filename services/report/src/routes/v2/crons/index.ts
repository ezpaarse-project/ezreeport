import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { Cron } from '@ezreeport/models/crons';

import authPlugin from '~/plugins/auth';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import {
  getAllCrons,
  stopCron,
  startCron,
  forceCron,
} from '~/models/rpc/client/crons';

import { NotFoundError } from '~/models/errors';

const SpecificCronParams = z.object({
  name: z.string().min(1).describe('Name of the cron'),
});

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all crons',
      tags: ['crons'],
      response: {
        ...describeErrors([
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(z.array(Cron)),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await getAllCrons();

      return buildSuccessResponse(content, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Cron),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await getAllCrons();
      const item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      return buildSuccessResponse(item, reply);
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
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Cron),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await getAllCrons();
      let item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      if (
        request.body.running != null &&
        request.body.running !== item.running
      ) {
        if (request.body.running) {
          item = await startCron(item.name);
        } else {
          item = await stopCron(item.name);
        }
      }

      return buildSuccessResponse(item, reply);
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
        ...describeErrors([
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Cron),
      },
    },
    config: {
      ezrAuth: {
        requireAdmin: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const content = await getAllCrons();
      let item = content.find((cron) => cron.name === request.params.name);
      if (!item) {
        throw new NotFoundError(`Cron ${request.params.name} not found`);
      }

      item = await forceCron(request.params.name);

      return buildSuccessResponse(item, reply);
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
