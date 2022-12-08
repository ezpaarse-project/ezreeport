import { Router, type RequestHandler, type RouterOptions } from 'express';
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
export const createRoute = <R extends Router>(
  router: R,
  route: HTTPRoute,
  ...handlers: RequestHandler[]
): R => {
  const [method, path] = route.split(' ', 2);

  const res = router[method.toLowerCase() as Lowercase<HTTPMethod>](
    path,
    ...handlers,
  );
  return res;
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
export const createSecuredRoute = <R extends Router & { _permPrefix?: string }>(
  router: R,
  route: HTTPRoute,
  minRole: Roles,
  ...handlers: RequestHandler[]
): R => {
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

type ExcludeFirst<T extends unknown[]> = T extends [unknown, ...(infer R)] ? R : [];

type CustomRouterType = {
  _permPrefix: string,

  /**
   * Create route
   *
   * @param route The name of route
   * @param handlers The handlers
   *
   * @returns The custom router
   */
  createRoute(
    this: Router & CustomRouterType,
    ...params: ExcludeFirst<Parameters<typeof createRoute>>
  ): Router & CustomRouterType,

  /**
   * Create secured route that will check elastic's role of user.
   *
   * Route is secured by {@link checkRight}, so :
   * - `req.user` with `username` & `email` from Elastic user.
   * - You can safely add `checkInstitution` middleware
   *
   * @param route The name of route
   * @param minRole The minimum role
   * @param handlers The handlers
   *
   * @returns The custom router
   */
  createSecuredRoute(
    this: Router & CustomRouterType,
    ...params: ExcludeFirst<Parameters<typeof createSecuredRoute>>
  ): Router & CustomRouterType,
};

/**
 * Warpper for creating an express router with some custom functions
 *
 * @param prefix Router prefix, used for perms
 * @param opts Router options passed to express
 *
 * @returns The router with custom functions
 */
export const CustomRouter = (prefix: string, opts?: RouterOptions): Router & CustomRouterType => {
  const additional: CustomRouterType = {
    _permPrefix: prefix,
    createRoute(...params) {
      return createRoute(this, ...params);
    },
    createSecuredRoute(...params) {
      return createSecuredRoute(this, ...params);
    },
  };
  return Object.assign(
    Router(opts),
    additional,
  );
};
