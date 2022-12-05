declare namespace Express {
  export interface Request {
    /**
     * User information from Elastic
     *
     * Added by `middlewares/auth::checkRight` & `middlewares/auth::checkInstitution`.
     */
    user?: {
      email: string,
      username: string,
      roles: string[],
      maxRolePriority: number,
      /**
       * Added by `middlewares/auth::checkInstitution`
       */
      institution?: string
    }
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
