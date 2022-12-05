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
}

/**
 * Get authed user info
 *
 * @returns The authed user info
 */
export const getCurrentUser = () => axios.$get<User>('/me');

/**
 * Compute auther user permissions
 *
 * @returns Permissions
 */
export const getPermissions = async () => {
  const { content: { maxRolePriority: maxRole } } = await getCurrentUser();

  return {
    crons: {
      read: maxRole >= Roles.SUPER_USER,
      update: maxRole >= Roles.SUPER_USER,
    },
    // health: true,
    tasks: {
      customInstitution: maxRole >= Roles.SUPER_USER,
      create: maxRole >= Roles.READ_WRITE,
      read: maxRole >= Roles.READ,
      update: maxRole >= Roles.READ_WRITE,
      delete: maxRole >= Roles.READ_WRITE,
    },
    reports: {
      create: maxRole >= Roles.READ_WRITE,
      read: maxRole >= Roles.READ,
    },
    queues: {
      read_all: maxRole >= Roles.READ,
      read_one: maxRole >= Roles.SUPER_USER,
      update: maxRole >= Roles.SUPER_USER,
      jobs: {
        read: maxRole >= Roles.READ,
        update: maxRole >= Roles.READ_WRITE,
      },
    },
    layouts: {
      read: maxRole >= Roles.READ_WRITE,
    },
  };
};
