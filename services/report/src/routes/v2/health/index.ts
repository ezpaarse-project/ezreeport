import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import { appLogger } from '~/lib/logger';

import { HTTPError, NotFoundError } from '~/models/errors';
import * as heartbeats from '~/models/heartbeat';
import { Heartbeat } from '~/models/heartbeat/types';

import {
  EmptyResponse,
  buildSuccessResponse,
  describeErrors,
  zSuccessResponse,
} from '~/routes/v2/responses';

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/',
    logLevel: 'debug',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: zSuccessResponse(
          z.object({
            current: z.string().describe('Current service'),
            services: z
              .array(Heartbeat)
              .describe('Services connected to current'),
            version: z.string().describe('Current version'),
          })
        ),
      },
      summary: 'Get status of stack',
      tags: ['health'],
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      buildSuccessResponse(
        {
          current: heartbeats.service.name,
          services: heartbeats.getAllServices(),
          version: heartbeats.service.version,
        },
        reply
      ),
  });

  fastify.route({
    method: 'GET',
    url: '/services',
    logLevel: 'debug',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.OK]: zSuccessResponse(
          z.array(Heartbeat).describe('Services connected to current')
        ),
      },
      summary: 'Ping all services',
      tags: ['health'],
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) =>
      buildSuccessResponse(heartbeats.getAllServices(), reply),
  });

  fastify.route({
    method: 'GET',
    url: '/services/:name',
    logLevel: 'debug',
    schema: {
      params: z.object({
        name: z.string().describe('Service name'),
      }),
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.NOT_FOUND,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(Heartbeat),
      },
      summary: 'Ping a service',
      tags: ['health'],
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const all = heartbeats.getAllServices();
      const content = all.find((srv) => srv.service === request.params.name);
      if (!content) {
        throw new NotFoundError(`Service ${request.params.name} not found`);
      }

      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/probes/liveness',
    logLevel: 'debug',
    schema: {
      response: {
        ...describeErrors([StatusCodes.INTERNAL_SERVER_ERROR]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Shorthand for liveness probe',
      tags: ['health'],
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      reply.status(StatusCodes.NO_CONTENT);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/probes/readiness',
    logLevel: 'debug',
    schema: {
      response: {
        ...describeErrors([
          StatusCodes.SERVICE_UNAVAILABLE,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.NO_CONTENT]: EmptyResponse,
      },
      summary: 'Shorthand for readiness probe',
      tags: ['health'],
    },
    // oxlint-disable-next-line require-await
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
      throw new HTTPError(
        'Readiness probe failed: missing mandatory services',
        StatusCodes.SERVICE_UNAVAILABLE
      );
    },
  });
};

// oxlint-disable-next-line no-default-export
export default router;
