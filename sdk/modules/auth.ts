import axios from '../lib/axios';

export interface User {
  username: string,
  email: string,
  roles: string[]
}

/**
 * Get authed user info
 *
 * @returns The authed user info
 */
export const getCurrentUser = () => axios.$get<User>('/me');
