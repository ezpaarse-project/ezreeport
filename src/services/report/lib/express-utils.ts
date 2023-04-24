import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
  type RouterOptions
} from 'express';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { registerRoute, registerRouteWithAccess } from '~/models/access';
import { requireAdmin, requireNamespace, requireUser } from '../middlewares/auth';
import { Access } from './prisma';
import { HTTPError } from '~/types/errors';
import { appLogger } from './logger';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type HTTPPath = `/${string}`;
type HTTPRoute = `${HTTPMethod} ${HTTPPath}`;

interface HandlerData {
  data: unknown,
  code?: StatusCodes,
  meta?: unknown
}

const handlerDataSchema = Joi.object<HandlerData>({
  data: Joi.any().required(),
  code: Joi.number().valid(...Object.values(StatusCodes)),
  meta: Joi.any(),
});

type RouteHandler = (req: Request, res: Response) => unknown | Promise<unknown>;

const isHandlerData = (data: unknown): data is HandlerData => {
  const validation = handlerDataSchema.validate(data, {});
  return !!validation.value && !validation.error;
};

const parseRouteName = <R extends Router & { _permPrefix?: string }>(
  router:R,
  route: HTTPRoute,
) => {
  const [method, path] = route.split(' ', 2);
  // Parse route name
  let routeName = path.slice(1).replace(/\//g, '-').replace(/:/g, '');
  routeName = `${method.toLowerCase()}-${routeName}`.replace(/-$/, '');
  if (router._permPrefix) {
    routeName = `${router._permPrefix}-${routeName}`;
  }
  if (routeName === method.toLowerCase()) {
    throw new Error('Something went wrong when parsing routeName: check if router have a "_permPerfix"');
  }

  return routeName;
};

/**
 * @see {@link CustomRouterType.createBasicRoute}
 */
export const createBasicRoute = <R extends Router>(
  router: R,
  route: HTTPRoute,
  handler: RouteHandler,
  ...middlewares: RequestHandler[]
): R => {
  const [method, path] = route.split(' ', 2);

  const asyncHandler: RequestHandler = (req, res) => {
    let promise: Promise<unknown>;

    try {
      // Call handler
      promise = Promise.resolve(handler(req, res));
    } catch (error) {
      promise = Promise.reject(error);
    }

    if (promise) {
      promise
        .then((v) => {
          // If response wasn't already sent
          if (!res.headersSent) {
            // Allow handler to just return data instead of HandlerData
            const val: HandlerData = isHandlerData(v) ? v : { data: v };
            res.sendJson(val.data, val.code, val.meta);
          }
        })
        .catch((err) => {
          if (!(err instanceof HTTPError)) {
            appLogger.error(err.message);
          }
          res.errorJson(err);
        });
    }
  };

  return router[method.toLowerCase() as Lowercase<HTTPMethod>](
    path,
    ...middlewares,
    asyncHandler,
  );
};

/**
 * @see {@link CustomRouterType.createNamespacedRoute}
 */
export const createNamespacedRoute = <R extends Router & { _permPrefix?: string }>(
  router: R,
  route: HTTPRoute,
  minAccess: Access,
  handler: RouteHandler,
  ...middlewares: RequestHandler[]
): R => {
  const routeName = parseRouteName(router, route);

  // Register route accessibility
  registerRouteWithAccess(
    routeName,
    minAccess,
  );

  return createBasicRoute(
    router,
    route,
    // Route handler
    handler,
    // Route middlewares
    requireUser,
    requireNamespace(minAccess),
    ...middlewares,
  );
};

/**
 * @see {@link CustomRouterType.createRoute}
 */
export const createRoute = <R extends Router>(
  router: R,
  route: HTTPRoute,
  handler: RouteHandler,
  ...middlewares: RequestHandler[]
): R => {
  const routeName = parseRouteName(router, route);

  registerRoute(routeName, false);

  return createBasicRoute(router, route, handler, ...middlewares);
};

/**
 * @see {@link CustomRouterType.createAdminRoute}
 */
export const createAdminRoute = <R extends Router>(
  router: R,
  route: HTTPRoute,
  handler: RouteHandler,
  ...middlewares: RequestHandler[]
): R => {
  const routeName = parseRouteName(router, route);

  registerRoute(routeName, true);

  return createBasicRoute(
    router,
    route,
    handler,
    // Route middlewares
    requireUser,
    requireAdmin,
    ...middlewares,
  );
};

/**
 * Type for CustomRouter (see later)
 */
type CustomRouterType = {
  _permPrefix: string,

  /**
   * Create basic route
   *
   * Unlike any `create*Method` method, **the route won't be registered in permission system**
   *
   * @param route The name of route
   * @param handler The executor of route. It can directly return data,
   * or an object like `{ data, code, meta }` where `data` and `meta` **AREN'T PROMISES**
   * and `code` is a StatusCode.
   * @param middlewares The middlewares. They're passed to express **BEFORE** `handler`
   *
   * @returns The custom router
   */
  createBasicRoute<R extends Router & CustomRouterType>(
    this: R,
    ...params: ExcludeFirst<Parameters<typeof createBasicRoute>>
  ): R,

  /**
   * Create route
   *
   * @param route The name of route
   * @param handler The executor of route. It can directly return data,
   * or an object like `{ data, code, meta }` where `data` and `meta` **AREN'T PROMISES**
   * and `code` is a StatusCode.
   * @param middlewares The middlewares. They're passed to express **BEFORE** `handler`
   *
   * @returns The custom router
   */
  createRoute<R extends Router & CustomRouterType>(
    this: R,
    ...params: ExcludeFirst<Parameters<typeof createRoute>>
  ): R,

  /**
   * Create secured route that will check user and will get namespaces.
   *
   * Route is secured by {@link requireUser}, so :
   * - `req.user` with data from DB
   *
   * {@link requireNamespace} is also applied, so :
   * - `req.namespaces` with allowed namespaces that the user want
   * - `req.namespaceIds` with allowed namespaces' ids that the user want
   *
   * @param route The name of route
   * @param minRole The minimum role in the namespace
   * @param handler The executor of route. It can directly return data,
   * or an object like `{ data, code, meta }` where `data` and `meta` **AREN'T PROMISES**
   * and `code` is a StatusCode.
   * @param middlewares The middlewares. They're passed to express **BEFORE** `handler`
   *
   * @returns The custom router
   */
  createNamespacedRoute<R extends Router & CustomRouterType>(
    this: R,
    ...params: ExcludeFirst<Parameters<typeof createNamespacedRoute>>
  ): R,

  /**
   * Create secured route that will check user & admin status.
   *
   * Route is secured by {@link requireUser} and {@link requireAdmin}, so :
   * - `req.user` with data from DB
   *
   * @param route The name of route
   * @param handler The executor of route. It can directly return data,
   * or an object like `{ data, code, meta }` where `data` and `meta` **AREN'T PROMISES**
   * and `code` is a StatusCode.
   * @param middlewares The middlewares. They're passed to express **BEFORE** `handler`
   *
   * @returns The custom router
   */
  createAdminRoute<R extends Router & CustomRouterType>(
    this: R,
    ...params: ExcludeFirst<Parameters<typeof createAdminRoute>>
  ): R,
};

/**
 * Wrapper for creating an express router with some custom functions
 *
 * @param prefix Router prefix, used for perms
 * @param opts Router options passed to express
 *
 * @returns The router with custom functions
 */
export const CustomRouter = (prefix: string, opts?: RouterOptions): Router & CustomRouterType => {
  const additional: CustomRouterType = {
    _permPrefix: prefix,

    createBasicRoute(...params) {
      return createBasicRoute(this, ...params);
    },

    createRoute(...params) {
      return createRoute(this, ...params);
    },

    createNamespacedRoute(...params) {
      return createNamespacedRoute(this, ...params);
    },

    createAdminRoute(...params) {
      return createAdminRoute(this, ...params);
    },
  };
  return Object.assign(
    Router(opts),
    additional,
  );
};
