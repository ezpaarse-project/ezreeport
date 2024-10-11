import type { FastifyPluginAsync } from 'fastify';
import { StatusCodes } from 'http-status-codes';

import { Type, type Static } from '~/lib/typebox';

import * as checks from '~/models/healthchecks';
import { HTTPError } from '~/types/errors';

const router: FastifyPluginAsync = async (fastify) => {
  /**
   * Get all services that current one can ping (himself included)
   */
  fastify.get(
    '/',
    { logLevel: 'debug' },
    async () => ({
      content: {
        current: checks.serviceName,
        currentVersion: checks.serviceVersion,
        services: [...checks.services],
      },
    }),
  );

  /**
   * Ping all services (himself included)
   */
  fastify.get(
    '/services/',
    { logLevel: 'debug' },
    async () => ({
      content: await checks.pingAll(),
    }),
  );

  /**
   * Ping specific service
   */
  const GetServiceParams = Type.Object({
    service: Type.String({ minLength: 1 }),
  });
  fastify.get<{ Params: Static<typeof GetServiceParams> }>(
    '/services/:service',
    {
      logLevel: 'debug',
      schema: {
        params: GetServiceParams,
      },
    },
    async (request) => {
      const { service } = request.params;

      if (!checks.isService(service)) {
        // As validation throws an error, this line shouldn't be called
        return {};
      }

      return {
        content: await checks.ping(service),
      };
    },
  );

  /**
   * Liveness probe, check if the server is up
   */
  fastify.get(
    '/probes/liveness',
    { logLevel: 'debug' },
    async () => ({}),
  );

  /**
   * Readiness probe, check if the server is ready
   */
  fastify.get(
    '/probes/readiness',
    { logLevel: 'debug' },
    async () => {
      const pongs = await checks.pingAll();
      const failedPong = pongs.find((pong): pong is checks.ErrorPong => !pong.status);
      if (failedPong) {
        throw new HTTPError(
          `Readiness probe failed: service "${failedPong.name}" is not available: ${failedPong.error}`,
          StatusCodes.SERVICE_UNAVAILABLE,
        );
      }
      return {};
    },
  );
};

export default router;
