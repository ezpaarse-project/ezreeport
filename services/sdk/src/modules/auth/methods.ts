import { client } from '~/lib/fetch';
import type { ApiResponse } from '~/lib/api';

import { assignPermission } from '~/helpers/permissions/decorator';

import type { Namespace } from '~/modules/namespaces/types';
import type { User } from '~/modules/users/types';

import type { UserPermissions } from './types';

/**
 * Get logged user info
 *
 *
 * @returns The logged user info
 */
export async function getCurrentUser(): Promise<User> {
  const { content } = await client.fetch<ApiResponse<User>>('/auth/me');

  return content;
}
assignPermission(getCurrentUser, 'GET /auth/me');

/**
 * Get logged user accessible namespaces
 *
 * @returns Namespaces
 */
export async function getCurrentNamespaces(): Promise<
  Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[]
> {
  const { content } = await client.fetch<
    ApiResponse<Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[]>
  >('/auth/me/namespaces');

  return content;
}
assignPermission(getCurrentNamespaces, 'GET /auth/me/namespaces');

/**
 * Get logged user permissions
 *
 * @returns Permissions
 */
export async function getCurrentPermissions(): Promise<UserPermissions> {
  const { content } = await client.fetch<ApiResponse<UserPermissions>>(
    '/auth/me/permissions'
  );

  return content;
}
assignPermission(getCurrentPermissions, 'GET /auth/me/permissions');
