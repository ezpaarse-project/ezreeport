declare namespace Express {
  export interface Request {
    /**
     * User information from DB
     *
     * Added by `middlewares/auth::requireUser`
     * (already included with `lib/express-utils::createSecuredRoute`)
     */
    user?: import('~/models/users').FullUser
    /**
     * Possible namespaces wanted by user
     *
     * Added by `middlewares/auth::requireNamespace`
     * (already included with `lib/express-utils::createSecuredRoute`)
     */
    namespaces?: import('~/models/users').FullUser['memberships']
    /**
     * Possible namespaces' ids wanted by user
     *
     * Added by `middlewares/auth::requireNamespace`
     * (already included with `lib/express-utils::createSecuredRoute`)
     */
    namespaceIds?: string[]
  }
  export interface Response {
    /**
     * Send formatted data as success.
     *
     * @param content The content
     * @param code The HTTP code of the response. `200` by default.
     * @param meta Additional metadata about content
     */
    sendJson: (content: unknown, code = 200, meta?: unknown) => void;
    /**
     * Send formatted error
     *
     * @param error The error
     */
    errorJson: (error: CustomError | Error) => void;
  }
}
