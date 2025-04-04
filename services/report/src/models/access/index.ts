import { randomBytes } from 'node:crypto';

import { Access, type Prisma } from '@ezreeport/database/types';

import { ensureSchema } from '@ezreeport/models/lib/zod';
import prisma from '~/lib/prisma';
import { appLogger } from '~/lib/logger';

import { Namespace, type NamespaceType } from '../namespaces/types';
import { User, type UserType } from '../users/types';

const logger = appLogger.child({ scope: 'perms' });

const accessValues: Record<Access, number> = {
  [Access.READ]: 1,
  [Access.READ_WRITE]: 2,
  [Access.SUPER_USER]: 3,
};

/**
 * Compare two access levels
 *
 * @param a First access level
 * @param b Second access level
 *
 * @return `-1` if a < b, `0` if a === b, `1` if a > b
 */
function compareAccess(a: Access, b: Access) {
  if (accessValues[a] === accessValues[b]) {
    return 0;
  }
  return accessValues[a] < accessValues[b] ? -1 : 1;
}

/**
 * Registered routes with access
 */
const accessPerRoute = new Map<string, Access>();

/**
 * Registered routes with admin required or not
 */
const adminPerRoute = new Map<string, boolean>();

/**
 * Register route with given access level
 *
 * @param route Route name
 * @param access Access level
 */
export function registerRouteWithAccess(route: string, access: Access) {
  logger.debug({
    route,
    access,
    msg: 'Registered route with minimum access',
  });
  accessPerRoute.set(route, access);
}

/**
 * Register route with given admin state
 *
 * @param route Route name
 * @param isAdminRequired Is admin required
 */
export function registerRoute(route: string, isAdminRequired: boolean) {
  logger.debug({
    route,
    isAdminRequired,
    msg: 'Registered route with admin required',
  });
  adminPerRoute.set(route, isAdminRequired);
}

/**
 * Generate auth token for user
 *
 * @returns Auth token
 */
export async function generateToken() {
  return new Promise<string>((resolve, reject) => {
    randomBytes(124, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString('base64'));
    });
  });
}

/**
 * Get user by token
 *
 * @param token The auth token
 *
 * @returns The user
 */
export async function getUserByToken(token: string): Promise<UserType | null> {
  const data = await prisma.user.findUnique({ where: { token } });
  return data && ensureSchema(User, data);
}

/**
 * Get namespaces of user
 *
 * @param username The username
 * @param access The minimum required access
 *
 * @returns The namespaces
 */
export async function getNamespacesOfUser(
  username: string,
  access?: Access,
): Promise<NamespaceType[]> {
  const where: Prisma.MembershipWhereInput = {
    username,
  };

  switch (access) {
    case Access.READ_WRITE:
      where.access = { in: [Access.READ_WRITE, Access.READ] };
      break;
    case Access.READ:
      where.access = { in: [Access.READ] };
      break;

    default:
      break;
  }

  const memberships = await prisma.membership.findMany({
    where,
    select: {
      namespace: true,
    },
  });

  const namespacesMap = new Map(memberships.map(({ namespace }) => [namespace.id, namespace]));

  return Promise.all(
    Array.from(namespacesMap.values())
      .map((n) => ensureSchema(Namespace, n, () => `Failed to parse namespace ${n.id}`)),
  );
}

/**
 * Get namespaces of admin
 *
 * @returns The namespaces
 */
export async function getNamespacesOfAdmin(): Promise<NamespaceType[]> {
  const namespaces = await prisma.namespace.findMany();

  return Promise.all(
    namespaces.map((n) => ensureSchema(Namespace, n, () => `Failed to parse namespace ${n.id}`)),
  );
}

/**
 * Get allowed routes of a user using registered routes
 *
 * @param username The username
 *
 * @returns Routes & if user is allowed
 */
export async function getRoutesOfUser(username: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { username } });

  const routes = new Map<string, boolean>(
    Array.from(adminPerRoute).map(([route, adminRequired]) => [
      route,
      user.isAdmin >= adminRequired,
    ]),
  );

  return routes;
}

/**
 * Get allowed routes of a user using registered routes, grouped by namespace
 *
 * @param username The username
 *
 * @returns Routes & if user is allowed
 */
export async function getRoutesPerNamespaceOfUser(username: string) {
  const memberships = await prisma.membership.findMany({
    where: {
      username,
    },
  });

  const routesPerNamespace = new Map(
    memberships.map(({ namespaceId, access }) => [
      namespaceId,
      new Map<string, boolean>(
        Array.from(accessPerRoute).map(([route, minAccess]) => [
          route,
          compareAccess(access, minAccess) >= 0,
        ]),
      ),
    ]),
  );

  return routesPerNamespace;
}

export async function getRoutesPerNamespaceOfAdmin() {
  const namespaces = await prisma.namespace.findMany();

  const routesPerNamespace = new Map(
    namespaces.map(({ id }) => [
      id,
      new Map<string, boolean>(
        Array.from(accessPerRoute).map(([route]) => [
          route,
          true,
        ]),
      ),
    ]),
  );

  return routesPerNamespace;
}

export { Access } from '@ezreeport/database/types';
