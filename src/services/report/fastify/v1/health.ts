import type { FastifyPluginAsync } from 'fastify';

import { Type, type Static } from '~/lib/typebox';

import * as checks from '~/models/healthchecks';

const router: FastifyPluginAsync = async (fastify) => {
  /**
   * Get all services that current one can ping (himself included)
   */
  fastify.get(
    '/',
    async () => ({
      content: {
        current: checks.serviceName,
        currentVersion: checks.serviceVersion,
        services: checks.services,
      },
    }),
  );

  /**
   * Ping all services (himself included)
   */
  fastify.get(
    '/all',
    async () => ({
      content: Promise.all(
        [...checks.services].map((s) => checks.ping(s)),
      ),
    }),
  );

  /**
   * Ping specific service
   */
  const GetServiceParams = Type.Object({
    service: Type.String({ minLength: 1 }),
  });
  fastify.get<{ Params: Static<typeof GetServiceParams> }>(
    '/:service',
    {
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
};

export default router;
