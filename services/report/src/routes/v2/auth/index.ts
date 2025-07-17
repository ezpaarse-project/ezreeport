import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';

import { z } from '@ezreeport/models/lib/zod';

import authPlugin from '~/plugins/auth';

import {
  describeErrors,
  buildSuccessResponse,
  zSuccessResponse,
} from '~/routes/v2/responses';

import * as access from '~/models/access';
import { User } from '~/models/users/types';
import { Namespace } from '~/models/namespaces/types';

const AccessPerRoute = z.record(
  z.string().min(1).describe('Route name'),
  z.boolean().describe('If user has access to route')
);

// oxlint-disable-next-line max-lines-per-function, require-await
const router: FastifyPluginAsyncZod = async (fastify) => {
  await fastify.register(authPlugin);

  fastify.route({
    method: 'GET',
    url: '/me',
    schema: {
      summary: 'Get current user info',
      tags: ['auth'],
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(User),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      // Since we're using ezrAuth, user is guaranteed to be defined
      const user = request.user!;

      return buildSuccessResponse(user, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/me/namespaces',
    schema: {
      summary: 'Get current user namespaces',
      tags: ['auth'],
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(
          z.array(Namespace.omit({ fetchLogin: true, fetchOptions: true }))
        ),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const { username, isAdmin } = request.user ?? {};

      let content;
      if (isAdmin) {
        content = await access.getNamespacesOfAdmin();
      } else {
        content = await access.getNamespacesOfUser(username ?? '');
      }

      return buildSuccessResponse(content, reply);
    },
  });

  fastify.route({
    method: 'GET',
    url: '/me/permissions',
    schema: {
      summary: 'Get current user permissions per route',
      tags: ['auth'],
      response: {
        ...describeErrors([
          StatusCodes.BAD_REQUEST,
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ]),
        [StatusCodes.OK]: zSuccessResponse(
          z.object({
            general: AccessPerRoute.describe('General routes'),

            namespaces: z
              .record(
                z.string().min(1).describe('Namespace ID'),
                AccessPerRoute
              )
              .describe('Routes where access depends on the namespace'),
          })
        ),
      },
    },
    config: {
      ezrAuth: {
        requireUser: true,
      },
    },
    // oxlint-disable-next-line require-await
    handler: async (request, reply) => {
      const { username, isAdmin } = request.user ?? {};

      const general = await access.getRoutesOfUser(username ?? '');

      let namespaces;
      if (isAdmin) {
        namespaces = await access.getRoutesPerNamespaceOfAdmin();
      } else {
        namespaces = await access.getRoutesPerNamespaceOfUser(username ?? '');
      }

      return buildSuccessResponse(
        {
          general: Object.fromEntries(general),
          namespaces: Object.fromEntries(
            Array.from(namespaces).map(([id, routes]) => [
              id,
              Object.fromEntries(routes),
            ])
          ),
        },
        reply
      );
    },
  });
};

// oxlint-disable-next-line no-default-exports
export default router;
