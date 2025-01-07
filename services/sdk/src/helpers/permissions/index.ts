import { getCurrentPermissions } from '~/modules/auth/methods';
import type { UserPermissions } from '~/modules/auth/types';

import { isSDKFunction } from './decorator';

let currentUserPermissions: UserPermissions | undefined;

/**
 * Refresh current user permissions
 */
export async function refreshPermissions(): Promise<void> {
  currentUserPermissions = await getCurrentPermissions();
}

/**
 * Check if the user have the permission to use the function
 *
 * @param fnc The function
 * @param namespaceId The namespaces where the function can be used, check if at least one is true
 *
 * @returns If the user have the permission
 */
export function hasPermission(fnc: Function, namespaceIds?: string[]): boolean {
  if (!isSDKFunction(fnc)) {
    // eslint-disable-next-line no-console
    console.warn(`[ezr][hasPermission] Function ${fnc.name} is not compatible with ezrPermission decorator`);
    return true;
  }

  if (!currentUserPermissions) {
    // eslint-disable-next-line no-console
    console.warn('[ezr][hasPermission] No current permissions set, please call refreshPermissions() first');
    return false;
  }

  const { general, namespaces } = currentUserPermissions;
  return fnc.ezrPermissions.every(({ permission, isNamespaced }) => {
    if (!isNamespaced) {
      return general[permission] || false;
    }

    // If no namespace provided, check if at least one is true
    const nIds = namespaceIds ?? Object.keys(namespaces);

    return nIds.some((id) => namespaces[id]?.[permission] || false);
  });
}
