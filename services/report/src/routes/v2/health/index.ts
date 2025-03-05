import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import * as responses from '~/routes/v2/responses';

import * as health from '~/models/health';
import {
  Pong, Services, FileSystems, FileSystemUsage,
} from '~/models/health/types';

import { HTTPError } from '~/types/errors';

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
            services: z.array(Services).describe('Services connected to current'),
            fs: z.array(FileSystems).describe('Filesystems'),
          }),
        ),
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => responses.buildSuccessResponse({
      current: health.serviceName,
      version: health.serviceVersion,
      services: Array.from(health.services),
      fs: Array.from(health.filesystems),
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
        [StatusCodes.OK]: responses.SuccessResponse(z.array(Pong)),
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const content = await health.pingAll();

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/services/:name',
    logLevel: 'debug',
    schema: {
      summary: 'Ping a service',
      tags: ['health'],
      params: z.object({
        name: Services.describe('Service name'),
      }),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(Pong),
        [StatusCodes.BAD_REQUEST]: responses.schemas[StatusCodes.BAD_REQUEST],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const content = await health.ping(request.params.name);

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
      const pongs = await health.pingAll();
      const failedPong = pongs.find((pong) => !pong.status);

      if (failedPong) {
        let message = `Readiness probe failed: service "${failedPong.name}" is not available`;
        if ('error' in failedPong) {
          message += `: ${failedPong.error}`;
        }
        throw new HTTPError(message, StatusCodes.SERVICE_UNAVAILABLE);
      }

      reply.status(StatusCodes.NO_CONTENT);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/fs',
    logLevel: 'debug',
    schema: {
      summary: 'Get usage of all file systems',
      tags: ['health'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.array(FileSystemUsage)),
        [StatusCodes.SERVICE_UNAVAILABLE]: responses.schemas[StatusCodes.SERVICE_UNAVAILABLE],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const content = await health.getUsageAll();

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/fs/:name',
    logLevel: 'debug',
    schema: {
      summary: 'Get usage of a file system',
      tags: ['health'],
      params: z.object({
        name: FileSystems.describe('Service name'),
      }),
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(FileSystemUsage),
        [StatusCodes.SERVICE_UNAVAILABLE]: responses.schemas[StatusCodes.SERVICE_UNAVAILABLE],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    handler: async (request, reply) => {
      const content = await health.getUsage(request.params.name);

      return responses.buildSuccessResponse(content, reply);
    },
  });
};

export default router;
