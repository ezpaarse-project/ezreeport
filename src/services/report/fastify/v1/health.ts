import type { FastifyPluginAsync } from 'fastify';

import { Type, type Static } from '~/lib/typebox';

import * as hc from '~/models/healthchecks';

const router: FastifyPluginAsync = async (fastify) => {
  /**
   * Get all services that current one can ping (himself included)
   */
  fastify.get(
    '/',
    async () => ({
      content: {
        current: hc.serviceName,
        currentVersion: hc.serviceVersion,
        services: hc.services,
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
        [...hc.services].map((s) => hc.ping(s)),
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

      if (!hc.isService(service)) {
        // As validation throws an error, this line shouldn't be called
        return {};
      }

      return {
        content: await hc.ping(service),
      };
    },
  );
};

export default router;
