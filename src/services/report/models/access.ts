import { Access } from '~/.prisma/client';

const accessValues: Record<Access, number> = {
  [Access.READ]: 1,
  [Access.READ_WRITE]: 2,
  [Access.SUPER_USER]: 3,
};

/**
 * Registered routes with access
 */
const accessPerRoute = new Map<string, number>();

/**
 * Register route with given access level
 *
 * @param route Route name
 * @param access Access level
 */
export const registerRouteWithAccess = (route: string, access: Access) => {
  accessPerRoute.set(route, accessValues[access]);
};

/**
 * Get access value
 *
 * @param access The access name
 *
 * @returns The access value
 */
export const getAccessValue = (access: Access) => accessValues[access];

/**
 * Get allowed routes of a given access's level using registered routes
 *
 * @param access The access's level
 *
 * @returns Routes & if given access is allowed
 */
export const getAllowedRoutes = (access: Access) => {
  const val = getAccessValue(access);
  const routes = new Map<string, boolean>();

  // eslint-disable-next-line no-restricted-syntax
  for (const [route, minAccess] of accessPerRoute) {
    routes.set(route, val >= minAccess);
  }

  return routes;
};

export { Access } from '~/.prisma/client';
