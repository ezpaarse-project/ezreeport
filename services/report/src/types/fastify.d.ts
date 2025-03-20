import type { Server } from '~/lib/sockets';

import type { UserType } from '~/models/users/types';
import type { Access } from '~/models/access';

declare module 'fastify' {
  export interface FastifyRequest {
    /**
     * User information from DB
     */
    user?: UserType;
  }

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
    }
  }

  export interface FastifyReply {
    apiVersion?: number;
  }

  export interface FastifyInstance {
    io: Server
  }
}
