import type { FastifyPluginAsync } from 'fastify';

import authPlugin from '~/plugins/auth';

import { Access, getAllowedRoutes, getRoutes } from '~/models/access';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'auth' });

  /**
   * Get all user info
   */
  fastify.get(
    '/',
    {
      config: {
        auth: {
          requireUser: true,
        },
      },
    },
    async (request) => ({ content: request.user }),
  );

  /**
   * Get namespaces that user can access
   */
  fastify.get(
    '/namespaces',
    {
      config: {
        auth: {
          access: Access.READ,
        },
      },
    },
    async (request) => ({
      content: request.namespaces?.map(({ namespace }) => namespace) ?? [],
    }),
  );

  /**
   * Get user's permissions per route
   */
  fastify.get(
    '/permissions',
    {
      config: {
        auth: {
          access: Access.READ,
        },
      },
    },
    async (request) => {
      const map = new Map<string, Record<string, boolean>>();

      // eslint-disable-next-line no-restricted-syntax
      for (const membership of request.namespaces ?? []) {
        map.set(
          membership.namespace.id,
          Object.fromEntries(
            getAllowedRoutes(membership.access),
          ),
        );
      }

      return {
        content: {
          general: Object.fromEntries(getRoutes(request.user?.isAdmin ?? false)),
          namespaces: Object.fromEntries(map),
        },
      };
    },
  );
};

export default router;
