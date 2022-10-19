declare namespace Express {
  export interface Request {
  }
  export interface Response {
    sendJson: (content: any) => void;
    errorJson: (error: CustomError | Error) => void;
  }
}
