/**
 * Roles names
 */
export enum Roles {
  SUPER_USER = 'superuser',
  READ_WRITE = 'ezreporting',
  READ = 'ezreporting_read_only',
}

/**
 * Roles priority, higher means more perms
 */
const ROLES_VALUES = {
  [Roles.SUPER_USER]: 9999,
  [Roles.READ_WRITE]: 2,
  [Roles.READ]: 1,
} as const;

export type RoleValues = (typeof ROLES_VALUES)[Roles];

/**
 * Registered routes with role
 */
const rolesPerRoute: Record<string, RoleValues> = {};

/**
 * Register route with given value
 *
 * @param route Route name
 * @param value Role value
 */
export const registerRouteWithRole = (route: string, value: RoleValues) => {
  rolesPerRoute[route] = value;
};

/**
 * Check if a string is a valid role
 *
 * @param role The possible role name
 *
 * @returns If given string is a valid role
 */
const isValidRole = (role: string): role is Roles => role in ROLES_VALUES;

/**
 * Get max role (+ value) out of given strings
 *
 * @param roles Possible roles
 *
 * @returns max role + value
 */
export const getMaxRole = (roles: string[]) => {
  const maxPrio = roles.reduce<RoleValues | -1>(
    (prev, role) => (
      (isValidRole(role) && ROLES_VALUES[role] >= prev) ? ROLES_VALUES[role] : prev
    ),
    -1,
  );
  return Object.entries(ROLES_VALUES).find(([, prio]) => prio === maxPrio);
};

/**
 * Get role value
 *
 * @param role The role name
 *
 * @returns The role value
 */
export const getRoleValue = (role: Roles) => ROLES_VALUES[role];

/**
 * Get allowed routes of a given role's value using registered routes
 *
 * @param maxValue The role's value
 *
 * @returns Routes & if given role is allowed
 */
export const getAllowedRoutes = (maxValue: RoleValues) => {
  const entries = Object.entries(rolesPerRoute);
  const routes: Record<string, boolean> = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const [route, minRole] of entries) {
    routes[route] = maxValue >= minRole;
  }
  return routes;
};
