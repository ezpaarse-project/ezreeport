import type { FastifyPluginAsync } from 'fastify';
import { StatusCodes } from 'http-status-codes';

import authPlugin from '~/plugins/auth';

import { Type, type Static } from '~/lib/typebox';

import { NotFoundError } from '~/types/errors';
import * as memberships from '~/models/memberships';
import * as users from '~/models/users';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'users' });

  /**
   * List all user
   */
  fastify.get<{
    Querystring: users.UserPaginationQueryType,
  }>(
    '/',
    {
      schema: {
        querystring: users.UserPaginationQuery,
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

      const list = await users.getAllUsers(pagination);

      return {
        content: list,
        meta: {
          total: await users.getCountUsers(),
          count: list.length,
          size: pagination.count,
          lastId: list.at(-1)?.username,
        },
      };
    },
  );

  /**
   * Replace all users by given data
   */
  const BulkUserBody = Type.Array(users.BulkUser);
  fastify.put<{
    Body: Static<typeof BulkUserBody>,
  }>(
    '/',
    {
      schema: {
        body: BulkUserBody,
      },
    },
    async (request) => {
      const content = await users.replaceManyUsers(request.body);

      return {
        content,
        meta: {
          users: await users.getCountUsers(),
          memberships: await memberships.getCountMemberships(),
        },
      };
    },
  );

  const SpecificUserParams = Type.Object({
    username: Type.String(),
  });
  type SpecificUserParamsType = Static<typeof SpecificUserParams>;

  /**
   * Get specific user
   */
  fastify.get<{
    Params: SpecificUserParamsType,
  }>(
    '/:username',
    {
      schema: {
        params: SpecificUserParams,
      },
    },
    async (request) => {
      const { username } = request.params;

      const item = await users.getUserByUsername(username);
      if (!item) {
        throw new NotFoundError(`User with username '${username}' not found`);
      }

      return { content: item };
    },
  );

  /**
   * Update or create a user
   */
  fastify.put<{
    Params: SpecificUserParamsType,
    Body: users.UserBodyType,
  }>(
    '/:username',
    {
      schema: {
        params: SpecificUserParams,
        body: users.UserBody,
      },
    },
    async (request, reply) => {
      const { username } = request.params;

      const item = await users.getUserByUsername(username);
      if (!item) {
        reply.code(StatusCodes.CREATED);
        return {
          content: await users.createUser(username, request.body),
        };
      }
      return {
        content: await users.editUserByUsername(username, request.body),
      };
    },
  );

  /**
   * Delete a user
   */
  fastify.delete<{
    Params: SpecificUserParamsType,
  }>(
    '/:username',
    {
      schema: {
        params: SpecificUserParams,
      },
    },
    async (request) => {
      const { username } = request.params;

      await users.deleteUserByUsername(username);
    },
  );

  const SpecificMembershipParams = Type.Intersect([
    SpecificUserParams,
    Type.Object({
      namespace: Type.String(),
    }),
  ]);
  type SpecificMembershipParamsType = Static<typeof SpecificMembershipParams>;

  /**
   * Get a membership of a user
   */
  fastify.get<{
    Params: SpecificMembershipParamsType,
  }>(
    '/:username/memberships/:namespace',
    {
      schema: {
        params: SpecificMembershipParams,
      },
    },
    async (request) => {
      const { username, namespace: namespaceId } = request.params;

      const userItem = await users.getUserByUsername(username);
      if (!userItem) {
        throw new NotFoundError(`User "${username}" not found`);
      }

      const membershipItem = userItem.memberships.find((m) => m.namespace.id === namespaceId);
      if (!membershipItem) {
        throw new NotFoundError(`User "${username}" is not in namespace "${namespaceId}"`);
      }
      return { content: membershipItem };
    },
  );

  /**
   * Update or add a user of a namespace
   */
  fastify.put<{
    Params: SpecificMembershipParamsType,
    Body: memberships.MembershipBodyType,
  }>(
    '/:username/memberships/:namespace',
    {
      schema: {
        params: SpecificMembershipParams,
        body: memberships.MembershipBody,
      },
    },
    async (request, reply) => {
      const { username, namespace: namespaceId } = request.params;

      let userItem = await users.getUserByUsername(username);
      if (!userItem) {
        throw new NotFoundError(`User "${username}" not found`);
      }

      const isMembershipExist = userItem.memberships.some((m) => m.namespace.id === namespaceId);
      if (!isMembershipExist) {
        reply.code(StatusCodes.CREATED);
        await memberships.addUserToNamespace(username, namespaceId, request.body);
      } else {
        await memberships.updateUserOfNamespace(username, namespaceId, request.body);
      }

      userItem = await users.getUserByUsername(username);
      return {
        content: userItem?.memberships.find((m) => m.namespace.id === namespaceId),
      };
    },
  );

  /**
   * Removes a user from a namespace
   */
  fastify.delete<{
    Params: SpecificMembershipParamsType,
  }>(
    '/:username/memberships/:namespace',
    {
      schema: {
        params: SpecificMembershipParams,
      },
    },
    async (request) => {
      const { username, namespace: namespaceId } = request.params;

      const userItem = await users.getUserByUsername(username);
      if (!userItem) {
        throw new NotFoundError(`User "${username}" not found`);
      }

      await memberships.removeUserFromNamespace(username, namespaceId);
    },
  );
};

export default router;
