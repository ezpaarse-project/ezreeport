import { parseISO } from 'date-fns';
import axios, { ApiResponse } from '../lib/axios';
import { parseNamespace, type Namespace, type RawNamespace } from './namespaces';

export enum Access {
  READ = 'READ',
  READ_WRITE = 'READ_WRITE',
  SUPER_USER = 'SUPER_USER',
}

interface RawMembership {
  access: Access,
  namespace: RawNamespace,

  createdAt: string,
  updatedAt?: string,
}

export interface Membership extends Omit<RawMembership, 'namespace' | 'createdAt' | 'updatedAt'> {
  namespace: Namespace,

  createdAt: Date,
  updatedAt?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param membership Raw membership
 *
 * @returns Parsed membership
 */
const parseMembership = (membership: RawMembership): Membership => ({
  ...membership,
  namespace: parseNamespace(membership.namespace),

  createdAt: parseISO(membership.createdAt),
  updatedAt: membership.updatedAt ? parseISO(membership.updatedAt) : undefined,
});

interface RawUser {
  username: string,
  token: string,
  isAdmin: true,
  memberships: RawMembership[],

  createdAt: string, // Date
  updatedAt?: string, // Date
}

export interface User extends Omit<RawUser, 'memberships' | 'createdAt' | 'updatedAt'> {
  memberships: Membership[],

  createdAt: Date,
  updatedAt?: Date,
}

/**
 * Transform raw data from JSON, to JS usable data
 *
 * @param user Raw user
 *
 * @returns Parsed user
 */
const parseUser = (user: RawUser): User => ({
  ...user,
  memberships: user.memberships.map(parseMembership),

  createdAt: parseISO(user.createdAt),
  updatedAt: user.updatedAt ? parseISO(user.updatedAt) : undefined,
});

export type Permissions = {
  /**
   * General routes independent of namespaces
   */
  general: {
    [routeId: string]: boolean
  },
  /**
   * Routes who are dependent of namespaces
   *
   * If wanted namespace isn't present, then user doesn't have access
   */
  namespaces: {
    [namespaceId: string]: {
      [routeId: string]: boolean
    }
  }
};

/**
 * Set API token for ezMESURE to axios
 *
 * @param token The API token for ezMESURE
 */
export const login = (token: string) => {
  axios.defaults.headers.common.authorization = `Bearer ${token}`;
};

/**
 * Unset API token for ezMESURE from axios
 */
export const logout = () => {
  axios.defaults.headers.common.authorization = undefined;
};

/**
 * Check if API token is setup in axios. **DOESN'T CHECK IF JWT IS VALID !**
 *
 * @returns If API token is setup
 */
export const isLogged = () => {
  const bearer = axios.defaults.headers.common.authorization;
  if (!bearer || typeof bearer !== 'string') return false;
  const [, token] = bearer.split('Bearer ');
  return !!token;
};

/**
 * Get logged user info
 *
 * Needs `auth-get` permission
 *
 * @returns The logged user info
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  const { content, ...response } = await axios.$get<RawUser>('/me');
  return {
    ...response,
    content: parseUser(content),
  };
};

/**
 * Compute logged user permissions
 *
 * Needs `auth-get-permissions` permission
 *
 * @returns Permissions
 */
export const getPermissions = () => axios.$get<Permissions>('/me/permissions');
