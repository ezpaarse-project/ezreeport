export interface ApiService {
  service: string;
  hostname: string;
  version?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface RawApiService extends Omit<ApiService, 'updatedAt' | 'createdAt'> {
  updatedAt: string;
  createdAt: string;
}

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

export interface ApiStatus {
  /** Current service */
  current: string;
  /** Current version */
  version: string;
  /** File system usage */
  fsUsage: FileSystemUsage[];
  /** Services connected to current */
  services: ApiService[];
}

export interface RawApiStatus extends Omit<ApiStatus, 'services'> {
  services: RawApiService[];
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
