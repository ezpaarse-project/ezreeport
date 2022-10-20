declare namespace Express {
  export interface Request {
    /**
     * User information from Elastic
     *
     * Added by `middlewares/auth`.
     */
    user?: {
      email: string,
      username: string
    }
  }
  export interface Response {
    sendJson: (content: any) => void;
    errorJson: (error: CustomError | Error) => void;
  }
}
