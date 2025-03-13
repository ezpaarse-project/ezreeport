import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~common/lib/zod';

import * as responses from '~/routes/v2/responses';

import * as heartbeats from '~/models/heartbeat';
import { Heartbeat } from '~/models/heartbeat/types';

import { HTTPError, NotFoundError } from '~/types/errors';
import { appLogger } from '~/lib/logger';

const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    logLevel: 'debug',
    schema: {
      summary: 'Get current service',
      tags: ['health'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(
          z.object({
            current: z.string().describe('Current service'),
            version: z.string().describe('Current version'),
            services: z.array(Heartbeat).describe('Services connected to current'),
          }),
        ),
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => responses.buildSuccessResponse({
      current: heartbeats.service.name,
      version: heartbeats.service.version,
      services: heartbeats.getAllServices(),
    }, reply),
  });

  fastify.route({
    method: 'GET',
    url: '/services',
    logLevel: 'debug',
    schema: {
      summary: 'Ping all services',
      tags: ['health'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(
          z.array(Heartbeat).describe('Services connected to current'),
        ),
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => responses.buildSuccessResponse(
      heartbeats.getAllServices(),
      reply,
    ),
  });

  fastify.route({
    method: 'GET',
    url: '/services/:name',
    logLevel: 'debug',
    schema: {
      summary: 'Ping a service',
      tags: ['health'],
      params: z.object({
        name: z.string().describe('Service name'),
      }),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Heartbeat),
        [StatusCodes.NOT_FOUND]: responses.schemas[StatusCodes.NOT_FOUND],
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const all = heartbeats.getAllServices();
      const content = all.find((s) => s.service === request.params.name);
      if (!content) {
        throw new NotFoundError(`Service ${request.params.name} not found`);
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/probes/liveness',
    logLevel: 'debug',
    schema: {
      summary: 'Shorthand for liveness probe',
      tags: ['health'],
      response: {
        [StatusCodes.NO_CONTENT]: responses.schemas[StatusCodes.NO_CONTENT],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      reply.status(StatusCodes.NO_CONTENT);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/probes/readiness',
    logLevel: 'debug',
    schema: {
      summary: 'Shorthand for readiness probe',
      tags: ['health'],
      response: {
        [StatusCodes.NO_CONTENT]: responses.schemas[StatusCodes.NO_CONTENT],
        [StatusCodes.SERVICE_UNAVAILABLE]: responses.schemas[StatusCodes.SERVICE_UNAVAILABLE],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const missing = heartbeats.getMissingMandatoryServices();
      if (missing.length <= 0) {
        reply.status(StatusCodes.NO_CONTENT);
        return;
      }

      appLogger.error({
        message: 'Readiness probe failed: missing mandatory services',
        missing,
      });
      throw new HTTPError('Readiness probe failed: missing mandatory services', StatusCodes.SERVICE_UNAVAILABLE);
    },
  });
};

export default router;
