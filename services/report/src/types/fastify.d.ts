import type { RawServerBase, RawServerDefault } from 'fastify';
import type { Access } from '~/models/access';
import type { FullUser } from '~/models/users';

interface CustomOptions {
  /**
   * Config of auth plugin for specific route
   */
  ezrAuth?: {
    /**
     * Minimum access level to access at this route,
     * Adds `request.user`, `request.namespaces` and `request.namespaceIds`.
     * */
    access?: Access;
    /** Should require a user, without checking access. Adds `request.user`. */
    requireUser?: boolean;
    /** Should require an admin user. Adds `request.user`. */
    requireAdmin?: boolean;
    /** Should require an API key. */
    requireAPIKey?: boolean;
  }
}

declare module 'fastify' {
  export interface FastifyRequest {
    /**
     * User information from DB
     *
     * Added by `config.auth.requireUser` & `config.auth.access`
     */
    user?: FullUser;
    /**
     * Possible namespaces wanted by user
     *
     * Added by `config.auth.requireNamespace`
     */
    namespaces?: FullUser['memberships'];
    /**
     * Possible namespaces' ids wanted by user
     *
     * Added by `config.auth.requireNamespace`
     */
    namespaceIds?: string[];
  }

  export interface FastifyReply {
    apiVersion?: number;
  }

  // eslint-disable-next-line max-len, @typescript-eslint/no-unused-vars
  export interface RouteShorthandOptions<T extends RawServerBase = RawServerDefault> extends CustomOptions { }
  export interface RouteOptions extends CustomOptions { }
}
