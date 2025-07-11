// oxlint-disable-next-line no-explicit-any
export type LambdaFunction = (...args: any[]) => any;

interface SDKFunctionAddition {
  ezrPermissions: { permission: string; isNamespaced: boolean }[];
}

export type SDKFunction = LambdaFunction & SDKFunctionAddition;

export function isSDKFunction(fnc: LambdaFunction): fnc is SDKFunction {
  return 'ezrPermissions' in fnc;
}

/**
 * Assign a permission name to a SDK function, used to check if the user have the permission
 *
 * @param fnc The function to decorate
 * @param permission The permission name (cf. /auth/me/permissions)
 * @param isNamespaced If the permission is namespaced (cf. /auth/me/permissions)
 */
export function assignPermission(
  fnc: LambdaFunction,
  permission: string,
  isNamespaced = false
): void {
  Object.defineProperty(fnc, 'ezrPermissions', {
    value: [{ permission, isNamespaced }],
    writable: false,
    enumerable: false,
  });
}

/**
 * Assign permission names of its dependencies to a SDK function, used to check if the user have
 *  the permission
 *
 * @param fnc The function to decorate
 * @param deps The dependencies
 * @param permission The additional permission name (cf. /auth/me/permissions)
 * @param isNamespaced If the additional permission is namespaced (cf. /auth/me/permissions)
 */
export function assignDependencies(
  fnc: LambdaFunction,
  deps: LambdaFunction[],
  permission?: string,
  isNamespaced = false
): void {
  const dependencies = deps.filter((dep) => isSDKFunction(dep));
  const permissions = dependencies.flatMap((dep) => dep.ezrPermissions);

  if (permission) {
    permissions.unshift({ permission, isNamespaced });
  }

  Object.defineProperty(fnc, 'ezrPermissions', {
    value: permissions,
    writable: false,
    enumerable: false,
  });
}
