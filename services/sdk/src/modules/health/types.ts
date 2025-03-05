export interface ApiStatus {
  /** Current service */
  current: string;
  /** Current version */
  version: string;
  /** Services connected to current */
  services: string[];
  /** File systems used by current */
  fs: string[];
}

export type Pong = {
  /** Service name */
  name: string;
  /** Service status */
  status: boolean;
  /** Time taken to respond */
  elapsedTime: number;
  /** HTTP status code */
  statusCode?: number | undefined;
} | {
  /** Service name */
  name: string;
  /** Service status */
  status: false;
  /** Error message */
  error: string;
};

export type FileSystemUsage = {
  /** Filesystem name */
  name: string;
  /** Total space */
  total: number;
  /** Used space */
  used: number;
  /** Available space */
  available: number;
};
