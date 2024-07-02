import type { FastifyPluginAsync } from 'fastify';

import { StatusCodes } from 'http-status-codes';
import authPlugin from '~/plugins/auth';

import { Type, type Static } from '~/lib/typebox';

import { NotFoundError, HTTPError } from '~/types/errors';
import * as memberships from '~/models/memberships';
import * as namespaces from '~/models/namespaces';
import { getUserByUsername } from '~/models/users';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'namespaces' });

  /**
   * List all namespaces
   */
  fastify.get<{
    Querystring: namespaces.NamespacePaginationQueryType,
  }>(
    '/',
    {
      schema: {
        querystring: namespaces.NamespacePaginationQuery,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request) => {
      const pagination = {
        count: request.query.count ?? 15,
        sort: (request.query.sort ?? 'createdAt'),
        previous: request.query.previous ?? undefined,
      };

      const list = await namespaces.getAllNamespaces(pagination);

      return {
        content: list,
        meta: {
          total: await namespaces.getCountNamespaces(),
          count: list.length,
          size: pagination.count,
          lastId: list.at(-1)?.id,
        },
      };
    },
  );

  /**
   * Replace namespaces and/or memberships
   */
  const BulkNamespaceBody = Type.Array(namespaces.BulkNamespace);
  fastify.put<{
    Body: Static<typeof BulkNamespaceBody>,
  }>(
    '/',
    {
      schema: {
        body: BulkNamespaceBody,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request) => {
      const content = await namespaces.replaceManyNamespaces(request.body);

      return {
        content,
        meta: {
          namespaces: await namespaces.getCountNamespaces(),
          members: await memberships.getCountMemberships(),
        },
      };
    },
  );

  const SpecificNamespaceParams = Type.Object({
    namespace: Type.String(),
  });
  type SpecificNamespaceParamsType = Static<typeof SpecificNamespaceParams>;

  /**
   * Get specific namespace
   */
  fastify.get<{
    Params: SpecificNamespaceParamsType,
  }>(
    '/:namespace',
    {
      schema: {
        params: SpecificNamespaceParams,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request) => {
      const { namespace: id } = request.params;

      const item = await namespaces.getNamespaceById(id);
      if (!item) {
        throw new HTTPError(`Namespace with id '${id}' not found`, StatusCodes.NOT_FOUND);
      }

      return {
        content: item,
      };
    },
  );

  /**
   * Update or create a namespace
  */
  fastify.put<{
    Params: SpecificNamespaceParamsType,
    Body: namespaces.NamespaceBodyType,
  }>(
    '/:namespace',
    {
      schema: {
        params: SpecificNamespaceParams,
        body: namespaces.NamespaceBody,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request, reply) => {
      const { namespace: id } = request.params;

      const item = await namespaces.getNamespaceById(id);
      if (!item) {
        reply.status(StatusCodes.CREATED);
        return {
          content: await namespaces.createNamespace(id, request.body),
        };
      }

      return {
        content: await namespaces.editNamespaceById(id, request.body),
      };
    },
  );

  /**
   * Delete a namespace
  */
  fastify.delete<{
    Params: SpecificNamespaceParamsType,
  }>(
    '/:namespace',
    {
      schema: {
        params: SpecificNamespaceParams,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request) => {
      const { namespace: id } = request.params;

      await namespaces.deleteNamespaceById(id);
    },
  );

  const SpecificMembershipParams = Type.Intersect([
    SpecificNamespaceParams,
    Type.Object({
      username: Type.String(),
    }),
  ]);
  type SpecificMembershipParamsType = Static<typeof SpecificMembershipParams>;

  /**
   * Get membership of a namespace
  */
  fastify.get<{
    Params: SpecificMembershipParamsType,
  }>(
    '/:namespace/members/:username',
    {
      schema: {
        params: SpecificMembershipParams,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request) => {
      const { namespace: id, username } = request.params;

      const namespace = await namespaces.getNamespaceById(id);
      if (!namespace) {
        throw new NotFoundError(`Namespace "${id}" not found`);
      }

      const userItem = await getUserByUsername(username);
      if (!userItem) {
        throw new NotFoundError(`User "${username}" not found`);
      }

      const membershipItem = namespace.memberships.find((m) => m.username === username);
      if (!membershipItem) {
        throw new NotFoundError(`User "${username}" is not in namespace "${namespace.id}"`);
      }

      return membershipItem;
    },
  );

  /**
   * Update or adds a user of a namespace
  */
  fastify.put<{
    Params: SpecificMembershipParamsType,
    Body: memberships.MembershipBodyType,
  }>(
    '/:namespace/members/:username',
    {
      schema: {
        params: SpecificMembershipParams,
        body: memberships.MembershipBody,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request, reply) => {
      const { namespace: id, username } = request.params;

      let namespaceItem = await namespaces.getNamespaceById(id);
      if (!namespaceItem) {
        throw new NotFoundError(`Namespace "${id}" not found`);
      }

      const userItem = await getUserByUsername(username);
      if (!userItem) {
        throw new NotFoundError(`User "${username}" not found`);
      }

      const isMembershipExist = namespaceItem.memberships.some((m) => m.username === username);
      if (!isMembershipExist) {
        reply.status(StatusCodes.CREATED);
        await memberships.addUserToNamespace(username, id, request.body);
      } else {
        await memberships.updateUserOfNamespace(username, id, request.body);
      }

      namespaceItem = await namespaces.getNamespaceById(id);
      return {
        content: namespaceItem?.memberships.find((m) => m.username === username),
      };
    },
  );

  /**
   * Removes a user from a namespace
  */
  fastify.delete<{
    Params: SpecificMembershipParamsType,
  }>(
    '/:namespace/members/:username',
    {
      schema: {
        params: SpecificMembershipParams,
      },
      ezrAuth: {
        requireAPIKey: true,
      },
    },
    async (request) => {
      const { namespace: id, username } = request.params;

      const namespace = await namespaces.getNamespaceById(id);
      if (!namespace) {
        throw new NotFoundError(`Namespace "${id}" not found`);
      }

      const user = await getUserByUsername(username);
      if (!user) {
        throw new NotFoundError(`User "${username}" not found`);
      }

      await memberships.removeUserFromNamespace(username, id);
    },
  );
};

export default router;
