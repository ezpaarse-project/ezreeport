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
 * Registered routes with admin required or not
 */
const adminPerRoute = new Map<string, boolean>();

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
 * Register route with given admin state
 *
 * @param route Route name
 * @param isAdminRequired Is admin required
 */
export const registerRoute = (route: string, isAdminRequired: boolean) => {
  adminPerRoute.set(route, isAdminRequired);
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
 * Get allowed routes of a given access' level using registered routes
 *
 * @param access The access' level
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

/**
 * Get allowed routes of a given admin state using registered routes
 *
 * @param isAdmin The admin state
 *
 * @returns Routes & if given admin state is allowed
 */
export const getRoutes = (isAdmin: boolean) => {
  const routes = new Map<string, boolean>();

  // eslint-disable-next-line no-restricted-syntax
  for (const [route, adminRequired] of adminPerRoute) {
    routes.set(route, isAdmin >= adminRequired);
  }

  return routes;
};

export { Access } from '~/.prisma/client';
