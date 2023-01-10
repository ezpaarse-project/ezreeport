import axios from '../lib/axios';

enum Roles {
  SUPER_USER = 9999,
  READ_WRITE = 2,
  READ = 1,
}

export interface User {
  username: string,
  email: string,
  roles: string[],
  maxRolePriority: Roles
  institution?: string
}

export interface Institution {
  id: string;
  indexPrefix: string;
  indexCount: number;
  role: string;
  space: string;
  name: string;
  city: string;
  website: string;
  auto: {
    ezmesure: boolean;
    ezpaarse: boolean;
    report: boolean;
    sushi: boolean;
  };
  validated: boolean;
  // domains: any[];
  logoId: string;
  // TODO: Map str into date
  updatedAt: Date;
  createdAt: Date;
  acronym: string;
  type: string;
  twitterUrl: string;
  youtubeUrl: string;
  docContactName: string;
  techContactName: string;
  hidePartner: boolean;
  sushiReadySince: Date;
}

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
 * Get authed user info
 *
 * Needs `auth-get` permission
 *
 * @returns The authed user info
 */
export const getCurrentUser = () => axios.$get<User>('/me');

/**
 * Compute auther user permissions
 *
 * Needs `auth-get-permissions` permission
 *
 * @returns Permissions
 */
export const getPermissions = () => axios.$get<Record<string, boolean>>('/me/permissions');

/**
 * Get all available institutions for authed user
 *
 * Needs `auth-get-institutions` permission
 *
 * @returns Default & available institutions
 */
export const getInstitutions = () => axios.$get<{ default?: string, available: Institution[] }>('/me/institutions');
