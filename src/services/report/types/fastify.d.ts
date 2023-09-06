import type { FullUser } from '~/models/users';

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
    apiVersion?: number,
  }
}
