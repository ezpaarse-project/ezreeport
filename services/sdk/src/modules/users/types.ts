export interface User {
  /** Username */
  username: string;
  /** Token used to authenticate user */
  token: string;
  /** If user is an admin */
  isAdmin: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt?: Date | null;
}

export interface RawUser extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt?: string | null;
}
