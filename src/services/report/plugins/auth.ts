import type {
  preValidationHookHandler,
  FastifyRequest,
  FastifyPluginAsync,
  FastifySchema,
} from 'fastify';
import { StatusCodes } from 'http-status-codes';

import { merge } from 'lodash';
import config from '~/lib/config';
import { Type, Value } from '~/lib/typebox';

import {
  getAccessValue,
  Access,
  registerRouteWithAccess,
  registerRoute,
} from '~/models/access';
import { getAllNamespaces } from '~/models/namespaces';
import { type FullUser, getUserByToken } from '~/models/users';

import { HTTPError } from '~/types/errors';

const { adminKey } = config;

/**
 * Pre-validation hook that checks if a user token is provided, valid and used by a user.
 *
 * @param request The fastify Request
 */
const requireUser: preValidationHookHandler = async (request) => {
  // Getting token
  const header = request.headers.authorization ?? '';
  const regexRes = /Bearer (?<token>.*)/i.exec(header);
  // If no username given/found
  if (!regexRes?.groups?.token) {
    throw new HTTPError(`'${request.method} ${request.originalUrl}' requires user`, StatusCodes.UNAUTHORIZED);
  }

  request.user = await getUserByToken(regexRes.groups.token) || undefined;
  if (!request.user) {
    throw new HTTPError('User not found', StatusCodes.UNAUTHORIZED);
  }
};

/**
 * Pre-validation hook that checks if a user is an admin
 *
 * @param request The fastify Request
 */
const requireAdmin: preValidationHookHandler = async (request) => {
  if (!request.user?.isAdmin) {
    throw new HTTPError('Admin status is required', StatusCodes.UNAUTHORIZED);
  }
};

/**
 * Pre-validation hook that checks if an API key is provided and valid
 *
 * @param request The fastify Request
 */
const requireAPIKey: preValidationHookHandler = (request) => {
  // Getting token
  const token = request.headers['x-api-key'] ?? '';
  // If no username given/found
  if (!token) {
    throw new HTTPError(`'${request.method} ${request.originalUrl}' requires API Key`, StatusCodes.UNAUTHORIZED);
  }

  if (adminKey !== token) {
    throw new HTTPError('Token is not valid', StatusCodes.UNAUTHORIZED);
  }
};

/**
 * Get possible namespaces using user (provided by `requireUser`) and his memberships with the
 * minimum access level
 *
 * @param request The fastify Request
 * @param minAccess The minimum access level needed to access this ressource
 *
 * @returns The namespaces that the user have access using access level
 */
const getPossibleNamespaces = async (
  request: FastifyRequest,
  minAccess: Access,
): Promise<FullUser['memberships']> => {
  const minAccessValue = getAccessValue(minAccess);

  if (!request.user) {
    return [];
  }

  if (request.user.isAdmin) {
    const { createdAt, updatedAt } = request.user;
    const namespaces = await getAllNamespaces();

    // To avoid issues, return a fake namespace
    if (namespaces.length < 1) {
      namespaces.push({
        id: '_',
        name: '_',
        logoId: '',
        createdAt: new Date('a'),
        updatedAt: new Date('a'),
        _count: {
          tasks: 0,
          memberships: 0,
        },
      });
    }

    return namespaces.map((namespace) => ({
      access: Access.SUPER_USER,
      createdAt,
      updatedAt,
      namespace,
    }));
  }

  return request.user.memberships.filter(
    ({ access }) => getAccessValue(access) >= minAccessValue,
  );
};

/**
 * Query params that can be provided for `requireAccess`
 */
const NamespaceQuery = Type.Partial(
  Type.Object({
    namespaces: Type.Array(
      Type.String({ minLength: 1 }),
    ),
  }),
);

/**
 * Prepare a pre-validation hook to lock ressource behind a specific access level
 *
 * @param minAccess  The minimum access level needed to access this ressource
 *
 * @returns A pre-validation hook that check if user have needed access level
 */
const requireAccess = (minAccess: Access): preValidationHookHandler => async (request) => {
  const possibleNamespaces = await getPossibleNamespaces(request, minAccess);

  // Get ids wanted by user
  let wantedIds: string[] | undefined;
  if (Value.Check(NamespaceQuery, request.query)) {
    ({ namespaces: wantedIds } = request.query);
  }

  let ids = new Set(possibleNamespaces.map(({ namespace: { id } }) => id) ?? []);
  if (ids.size <= 0) {
    request.namespaceIds = [];
    request.namespaces = [];
    return;
  }

  if (wantedIds) {
    if (!Array.isArray(wantedIds)) {
      throw new HTTPError('Given namespaces ids are not an array', StatusCodes.BAD_REQUEST);
    }

    ids = new Set(
      wantedIds
        .map((id) => id.toString())
        .filter((id) => ids.has(id)),
    );
  }

  if (ids.size <= 0) {
    throw new HTTPError("Can't find your namespace(s)", StatusCodes.BAD_REQUEST);
  }

  request.namespaceIds = [...ids];
  request.namespaces = possibleNamespaces.filter(({ namespace: { id } }) => ids.has(id));
};

/**
 * The config of the plugin
 */
const pluginConfig = Type.Object({
  prefix: Type.String(),
});

/**
 * The config of the routes using the plugin
 */
const authConfig = Type.Object({
  auth: Type.Optional(
    Type.Object({
      requireAPIKey: Type.Optional(
        Type.Boolean(),
      ),
      requireAdmin: Type.Optional(
        Type.Boolean(),
      ),
      requireUser: Type.Optional(
        Type.Boolean(),
      ),
      access: Type.Optional(
        Type.Enum(Access),
      ),
    }),
  ),
});

/**
 * Fastify plugin to secure ressources by adding pre-validation hooks when a route is registered
 *
 * @param fastify The fastify instance
 * @param pluginOpts The plugin options
 */
const authPlugin: FastifyPluginAsync = async (fastify, pluginOpts) => {
  if (!Value.Check(pluginConfig, pluginOpts)) {
    return;
  }

  fastify.decorateRequest('user');
  fastify.decorateRequest('namespaces');
  fastify.decorateRequest('namespaceIds');

  fastify.addHook('onRoute', (routeOpts) => {
    if (!Value.Check(authConfig, routeOpts.config) || !routeOpts.config.auth) {
      return;
    }

    // Prepare for registration
    let registered = false;
    const shouldRegister = routeOpts.method !== 'HEAD' && !/^\/v\d+\//i.test(routeOpts.prefix);
    const method = routeOpts.method.toString().toLowerCase();
    const url = routeOpts.routePath
      .replace(/[/]/g, '-')
      .replace(/[:]/g, '');
    const routeName = `${pluginOpts.prefix}-${method}${url}`;

    // Get previous hooks
    let preValidation: preValidationHookHandler[] = [];
    if (routeOpts.preValidation) {
      preValidation = Array.isArray(routeOpts.preValidation)
        ? routeOpts.preValidation
        : [routeOpts.preValidation];
    }

    // If require API key
    if (!registered && routeOpts.config.auth.requireAPIKey) {
      preValidation.push(requireAPIKey);
      registered = true;
    }

    // If require admin
    if (!registered && routeOpts.config.auth.requireAdmin) {
      preValidation.push(
        requireUser,
        requireAdmin,
      );

      if (shouldRegister) {
        registerRoute(routeName, true);
      }
      registered = true;
    }

    // If require a user
    if (!registered && routeOpts.config.auth.requireUser) {
      preValidation.push(requireUser);

      if (shouldRegister) {
        registerRoute(routeName, false);
      }
      registered = true;
    }

    // If require access to namespaces
    if (!registered && routeOpts.config.auth.access) {
      // eslint-disable-next-line no-param-reassign
      routeOpts.schema = merge<Object, FastifySchema, FastifySchema>(
        {},
        routeOpts.schema ?? {},
        {
          querystring: NamespaceQuery,
        },
      );

      preValidation.push(
        requireUser,
        requireAccess(routeOpts.config.auth.access),
      );

      if (shouldRegister) {
        registerRouteWithAccess(routeName, routeOpts.config.auth.access);
      }
      registered = true;
    }

    // Add new hooks
    // eslint-disable-next-line no-param-reassign
    routeOpts.preValidation = preValidation;
  });
};
// Tell fastify to not create a new scope
// @ts-expect-error
authPlugin[Symbol.for('skip-override')] = true;

export default authPlugin;
