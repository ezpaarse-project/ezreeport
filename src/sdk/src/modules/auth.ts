import { parseISO } from 'date-fns';

import axios, { ApiResponse } from '../lib/axios';

import {
  parseNamespace,
  type Namespace,
  type RawNamespace,
  type TaskCount,
} from './namespaces';

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
  memberships: (RawMembership & TaskCount)[],

  createdAt: string, // Date
  updatedAt?: string, // Date
}

export interface User extends Omit<RawUser, 'memberships' | 'createdAt' | 'updatedAt'> {
  memberships: (Membership & TaskCount)[],

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
  memberships: user.memberships.map(parseMembership) as (Membership & TaskCount)[],

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
 * Set auth token to axios
 *
 * @param token The auth token
 */
export const login = (token: string) => {
  axios.defaults.headers.common.authorization = `Bearer ${token}`;
};

/**
 * Unset auth token from axios
 */
export const logout = () => {
  axios.defaults.headers.common.authorization = undefined;
};

/**
 * Check if auth token is setup in axios. **DOESN'T CHECK IF TOKEN IS VALID !**
 *
 * @returns If auth token is setup
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
 * Needs `general.auth-get` permission
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
 * Get logged user permissions
 *
 * Needs `namespaces[namespaceId].auth-get-permissions` permission
 *
 * @returns Permissions
 */
export const getCurrentPermissions = () => axios.$get<Permissions>('/me/permissions');

/**
 * Get logged user accessible namespaces
 *
 * Needs `namespaces[namespaceId].auth-get-namespaces` permission
 *
 * @returns Permissions
 */
export const getCurrentNamespaces = () => axios.$get<(Namespace & TaskCount)[]>('/me/namespaces');
