import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
  type RouterOptions
} from 'express';
import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import { registerRouteWithAccess } from '~/models/access';
import { requireNamespace, requireUser } from '../middlewares/auth';
import { Access } from './prisma';

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

/**
 * @see {@link CustomRouterType.createRoute}
 */
export const createRoute = <R extends Router>(
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
        .catch((err) => res.errorJson(err));
    }
  };

  return router[method.toLowerCase() as Lowercase<HTTPMethod>](
    path,
    ...middlewares,
    asyncHandler,
  );
};

/**
 * @see {@link CustomRouterType.createSecuredRoute}
 */
export const createSecuredRoute = <R extends Router & { _permPrefix?: string }>(
  router: R,
  route: HTTPRoute,
  minAccess: Access,
  handler: RouteHandler,
  ...middlewares: RequestHandler[]
): R => {
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

  // Register route accessibility
  registerRouteWithAccess(
    routeName,
    minAccess,
  );

  return createRoute(
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
 * Type for CustomRouter (see later)
 */
type CustomRouterType = {
  _permPrefix: string,

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
   * Create secured route that will check user.
   *
   * Route is secured by {@link checkRight}, so :
   * - `req.user` with data from DB.
   *
   * @param route The name of route
   * @param minRole The minimum role
   * @param handler The executor of route. It can directly return data,
   * or an object like `{ data, code, meta }` where `data` and `meta` **AREN'T PROMISES**
   * and `code` is a StatusCode.
   * @param middlewares The middlewares. They're passed to express **BEFORE** `handler`
   *
   * @returns The custom router
   */
  createSecuredRoute<R extends Router & CustomRouterType>(
    this: R,
    ...params: ExcludeFirst<Parameters<typeof createSecuredRoute>>
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
