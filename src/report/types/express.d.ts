declare namespace Express {
  export interface Request {
    /**
     * User information from Elastic
     *
     * Added by `middlewares/auth`.
     */
    user?: {
      email: string,
      username: string,
      roles: string[]
    }
  }
  export interface Response {
    /**
     * Send formatted data as success.
     *
     * @param content The content
     * @param code The HTTP code of the response. `200` by default.
     */
    sendJson: (content: any, code = 200) => void;
    /**
     * Send formatted error
     */
    errorJson: (error: CustomError | Error) => void;
  }
}
