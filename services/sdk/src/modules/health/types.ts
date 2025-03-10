export interface ApiStatus {
  /** Current service */
  current: string;
  /** Current version */
  version: string;
  /** Services connected to current */
  services: string[];
}

export type Pong = {
  /** Service name */
  name: string;
  /** Is service mandatory for ezREEPORT */
  mandatory: boolean;
  /** Service status */
  status: boolean;
  /** Time taken to respond */
  elapsedTime: number;
  /** HTTP status code */
  statusCode?: number | undefined;
} | {
  /** Service name */
  name: string;
  /** Is service mandatory for ezREEPORT */
  mandatory: boolean;
  /** Service status */
  status: false;
  /** Error message */
  error: string;
};
