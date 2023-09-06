import type { FastifyPluginAsync } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';

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

  const PingServiceParams = Type.Object({
    service: Type.String(),
  });
  type PingServiceParamsType = Static<typeof PingServiceParams>;

  /**
   * Ping specific service
   */
  fastify.get<{ Params: PingServiceParamsType }>(
    '/:service',
    {
      schema: {
        params: PingServiceParams,
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
