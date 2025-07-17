export interface FileSystemUsage {
  /** Filesystem name */
  name: string;
  /** Total space */
  total: number;
  /** Used space */
  used: number;
  /** Available space */
  available: number;
}

export interface ApiService {
  service: string;
  hostname: string;
  version?: string;
  filesystems?: FileSystemUsage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RawApiService extends Omit<ApiService, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface ApiStatus {
  /** Current service */
  current: string;
  /** Current version */
  version: string;
  /** Services connected to current */
  services: ApiService[];
}

export interface RawApiStatus extends Omit<ApiStatus, 'services'> {
  services: RawApiService[];
}
