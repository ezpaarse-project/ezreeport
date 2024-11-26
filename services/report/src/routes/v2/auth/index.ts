import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '~/lib/zod';

import authPlugin from '~/plugins/authv2';

import * as responses from '~/routes/v2/responses';

import * as access from '~/models/access';
import { User } from '~/models/users/types';
import { Namespace } from '~/models/namespaces/types';

const AccessPerRoute = z.record(
  z.string().min(1)
    .describe('Route name'),
  z.boolean()
    .describe('If user has access to route'),
);

const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/me',
    schema: {
      summary: 'Get current user info',
      tags: ['auth'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(User),
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
      },
    },
    handler: async (request, reply) => {
      // Since we're using ezrAuth, user is guaranteed to be defined
      const user = request.user!;

      return responses.buildSuccessResponse(user, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/me/namespaces',
    schema: {
      summary: 'Get current user namespaces',
      tags: ['auth'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(
          z.array(Namespace.omit({ fetchLogin: true, fetchOptions: true })),
        ),
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
        [StatusCodes.INTERNAL_SERVER_ERROR]: responses.schemas[StatusCodes.INTERNAL_SERVER_ERROR],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
      },
    },
    handler: async (request, reply) => {
      const { username, isAdmin } = request.user ?? {};

      let content;
      if (isAdmin) {
        content = await access.getNamespacesOfAdmin();
      } else {
        content = await access.getNamespacesOfUser(username ?? '');
      }

      return responses.buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/me/permissions',
    schema: {
      summary: 'Get current user permissions per route',
      tags: ['auth'],
      response: {
        [StatusCodes.OK]: responses.SuccessResponse(z.object({
          general: AccessPerRoute
            .describe('General routes'),

          namespaces: z.record(
            z.string().min(1)
              .describe('Namespace ID'),
            AccessPerRoute,
          ).describe('Routes where access depends on the namespace'),
        })),
        [StatusCodes.UNAUTHORIZED]: responses.schemas[StatusCodes.UNAUTHORIZED],
        [StatusCodes.FORBIDDEN]: responses.schemas[StatusCodes.FORBIDDEN],
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
      },
    },
    handler: async (request, reply) => {
      const { username, isAdmin } = request.user ?? {};

      const general = await access.getRoutesOfUser(username ?? '');

      let namespaces;
      if (isAdmin) {
        namespaces = await access.getRoutesPerNamespaceOfAdmin();
      } else {
        namespaces = await access.getRoutesPerNamespaceOfUser(username ?? '');
      }

      return responses.buildSuccessResponse({
        general: Object.fromEntries(general),
        namespaces: Object.fromEntries(
          Array.from(namespaces).map(([id, routes]) => [id, Object.fromEntries(routes)]),
        ),
      }, reply);
    },
  });
};

export default router;
