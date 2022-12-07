import type { RequestHandler, Router } from 'express';
import { checkRight } from '../middlewares/auth';
import { getRoleValue, registerRouteWithRole, Roles } from '../models/roles';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type HTTPPath = `/${string}`;
type HTTPRoute = `${HTTPMethod} ${HTTPPath}`;

/**
 * Create route
 *
 * @param router The router
 * @param route The name of route
 * @param handlers The handlers
 *
 * @returns The router
 */
export const createRoute = (
  router: Router,
  route: HTTPRoute,
  ...handlers: RequestHandler[]
) => {
  const [method, path] = route.split(' ', 2);

  return router[method.toLowerCase() as Lowercase<HTTPMethod>](
    path,
    ...handlers,
  );
};

/**
 * Create secured route that will check elastic's role of user.
 *
 * Route is secured by {@link checkRight}, so :
 * - `req.user` with `username` & `email` from Elastic user.
 * - You can safely add `checkInstitution` middleware
 *
 * @param router The router
 * @param route The name of route
 * @param minRole The minimum role
 * @param handlers The handlers
 *
 * @returns The router
 */
export const createSecuredRoute = (
  router: Router & { _permPrefix?: string },
  route: HTTPRoute,
  minRole: Roles,
  ...handlers: RequestHandler[]
) => {
  const [method, path] = route.split(' ', 2);

  // Parse routename
  let routeName = path.slice(1).replace(/\//g, '-').replace(/:/g, '');
  routeName = `${method.toLowerCase()}-${routeName}`.replace(/-$/, '');
  // eslint-disable-next-line no-underscore-dangle
  if (router._permPrefix) {
    // eslint-disable-next-line no-underscore-dangle
    routeName = `${router._permPrefix}-${routeName}`;
  }
  if (routeName === method.toLowerCase()) {
    throw new Error('Something went wrong when parsing routeName: check if router have a "_permPerfix"');
  }

  // Register route priority
  const minRolePriority = getRoleValue(minRole);
  registerRouteWithRole(
    routeName,
    minRolePriority,
  );

  return createRoute(
    router,
    route,
    checkRight(minRolePriority),
    ...handlers,
  );
};
