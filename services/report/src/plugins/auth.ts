import type {
  preValidationHookHandler,
  FastifyRequest,
  FastifyPluginAsync,
  FastifyContextConfig,
} from 'fastify';
import fp from 'fastify-plugin';
import { StatusCodes } from 'http-status-codes';

import { ensureArray } from '@ezreeport/models/lib/utils';

import config from '~/lib/config';

import type { UserType } from '~/models/users/types';
import {
  registerRouteWithAccess,
  registerRoute,
  getNamespacesOfUser,
  getUserByToken,
  type Access,
} from '~/models/access';

import { HTTPError } from '~/models/errors';

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
    throw new HTTPError(
      `'${request.method} ${request.originalUrl}' requires user`,
      StatusCodes.UNAUTHORIZED
    );
  }

  const user = await getUserByToken(regexRes.groups.token);
  if (!user) {
    throw new HTTPError('User not found', StatusCodes.UNAUTHORIZED);
  }

  request.user = user;
};

/**
 * Pre-validation hook that checks if a user is an admin
 *
 * Needs @see {requireUser}
 *
 * @param request The fastify Request
 */
const requireAdmin: preValidationHookHandler = async (request) => {
  if (!request.user?.isAdmin) {
    throw new HTTPError('Admin status is required', StatusCodes.FORBIDDEN);
  }
};

/**
 * Pre-validation hook that checks if an API key is provided and valid
 *
 * @param request The fastify Request
 */
const requireAPIKey: preValidationHookHandler = async (request) => {
  // Getting token
  const token = request.headers['x-api-key'] ?? '';

  // If no username given/found
  if (!token) {
    throw new HTTPError(
      `'${request.method} ${request.originalUrl}' requires API Key`,
      StatusCodes.UNAUTHORIZED
    );
  }

  if (adminKey !== token) {
    throw new HTTPError('Token is not valid', StatusCodes.UNAUTHORIZED);
  }
};

/**
 * Gets pre-validation hooks to the route if needed
 *
 * @param param0 The route options
 * @param registerName Name to register the route, if not present it won't be registered
 *
 * @returns The pre-validation hooks to add
 */
function preparePreValidation(
  { ezrAuth }: FastifyContextConfig,
  registerName?: string
): preValidationHookHandler[] {
  if (!ezrAuth) {
    return [];
  }

  // Strongest method to weakest
  switch (true) {
    case ezrAuth.requireAPIKey:
      return [requireAPIKey];

    case ezrAuth.requireAdmin:
      if (registerName) {
        registerRoute(registerName, true);
      }
      return [requireUser, requireAdmin];

    case !!ezrAuth.access:
      if (registerName) {
        registerRouteWithAccess(registerName, ezrAuth.access);
      }
      return [requireUser];

    case ezrAuth.requireUser:
      if (registerName) {
        registerRoute(registerName, false);
      }
      return [requireUser];

    default:
      return [];
  }
}

/**
 * Fastify plugin to secure ressources by adding pre-validation hooks when a route is registered
 *
 * @param fastify The fastify instance
 */
const authBasePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user');

  fastify.addHook('onRoute', (routeOpts) => {
    if (!routeOpts.config?.ezrAuth) {
      return;
    }

    // Prepare for registration
    const shouldRegister =
      routeOpts.method !== 'HEAD' && !/^\/v\d+\//i.test(routeOpts.prefix); // Don't register versioned routes
    const method = ensureArray(routeOpts.method)[0].toUpperCase();
    const routeName = `${method} ${routeOpts.url}`;

    // Get previous hooks
    const preValidation = ensureArray(routeOpts.preValidation || []);

    preValidation.push(
      ...preparePreValidation(
        routeOpts.config,
        shouldRegister ? routeName : undefined
      )
    );

    // Add new hooks
    routeOpts.preValidation = preValidation;
  });
};

// Register plugin
const authPlugin = fp(authBasePlugin, {
  name: 'ezr-auth',
  encapsulate: false,
});

export default authPlugin;

/**
 * Utility function to restrict namespaces of a list to the ones of the user
 *
 * @param request The fastify Request
 * @param namespacesIds The provided namespace ids, if not provided default to all
 *
 * @returns The ids of namespaces that the user have access, if undefined user have access to all
 */
export async function restrictNamespaces<Request extends FastifyRequest>(
  request: Request,
  namespacesIds?: string[]
): Promise<string[] | undefined> {
  const user = request.user!;
  // Don't check namespaces if admin
  if (user.isAdmin) {
    return namespacesIds;
  }

  const namespacesOfUser = await getNamespacesOfUser(user.username);
  let ids = namespacesOfUser.map((namespace) => namespace.id);

  if (namespacesIds) {
    const userNamespaceIds = new Set(ids ?? []);
    ids = namespacesIds.filter((id) => userNamespaceIds.has(id));
  }

  return ids;
}

/**
 * Utility function to check if user have access to namespace
 *
 * @param request The fastify Request
 * @param namespaceId The id of the namespace
 */
export async function requireAllowedNamespace<Request extends FastifyRequest>(
  request: Request,
  namespaceId: string
): Promise<void> {
  const user = request.user!;
  // Don't check namespaces if admin
  if (user.isAdmin) {
    return;
  }

  const namespacesOfUser = await getNamespacesOfUser(user.username);
  // Check if user have access to namespace
  const namespaceOfTask = namespacesOfUser.find(
    (namespace) => namespaceId === namespace.id
  );
  if (!namespaceOfTask) {
    throw new HTTPError(
      "You don't have access to the provided namespace",
      StatusCodes.FORBIDDEN
    );
  }
}

declare module 'fastify' {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  export interface FastifyRequest {
    /**
     * User information from DB
     */
    user?: UserType;
  }

  // oxlint-disable-next-line typescript/consistent-type-definitions
  export interface FastifyContextConfig {
    /**
     * Config of auth plugin for specific route
     */
    ezrAuth?: {
      /** Should require an API key. */
      requireAPIKey?: boolean;
      /** Should require a user, without checking access. Adds `request.user`. */
      requireUser?: boolean;
      /** Should require an admin user. Implies `requireUser: true` */
      requireAdmin?: boolean;
      /** Minimum access level to access at this route. Implies `requireUser: true` */
      access?: Access;
    };
  }
}
