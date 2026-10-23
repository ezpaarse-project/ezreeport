import { z } from '@ezreeport/models/lib/zod';

import {
  BulkMembership,
  BulkMembershipResult,
} from '~/models/memberships/types';

/**
 * Validation for a user
 */
export const User = z.object({
  createdAt: z.date().describe('Creation date'),

  isAdmin: z
    .boolean()
    .default(false)
    .optional()
    .describe('If user is an admin'),

  token: z
    .string()
    .min(1)
    .describe(
      'Token used to authenticate user, generated when user is created'
    ),

  updatedAt: z.date().nullable().describe('Last update date'),

  username: z.string().min(1).describe('Username'),
});

/**
 * Type for a user
 */
export type UserType = z.infer<typeof User>;

/**
 * Validation when creating/updating a user
 */
export const InputUser = User.omit({
  // Stripping readonly properties
  username: true,
  token: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for creating/updating a user
 */
export type InputUserType = z.infer<typeof InputUser>;

/**
 * Validation for filters
 */
export const UserQueryFilters = z.object({
  isAdmin: z.stringbool().optional().describe('If user is an admin'),

  query: z.string().optional().describe('Query used for searching'),
});

/**
 * Type for filters
 */
export type UserQueryFiltersType = z.infer<typeof UserQueryFilters>;

/**
 * Validation for setting multiple users
 */
export const BulkUser = z.object({
  isAdmin: z
    .boolean()
    .default(false)
    .optional()
    .describe('If user is an admin'),

  memberships: z
    .array(BulkMembership.omit({ username: true }))
    .optional()
    .describe('Namespaces of the user'),

  username: z.string().min(1).describe('Username'),
});

/**
 * Type for setting multiple users
 */
export type BulkUserType = z.infer<typeof BulkUser>;

/**
 * Validation for result of setting multiple users
 */
export const BulkUserResult = z.object({
  ...BulkMembershipResult.partial().shape,

  users: z
    .object({
      created: z.int().min(0).describe('Number of item created'),

      deleted: z.int().min(0).describe('Number of item deleted'),

      updated: z.int().min(0).describe('Number of item updated'),
    })
    .describe('Summary of operations on users'),
});

/**
 * Type for result of setting multiple users
 */
export type BulkUserResultType = z.infer<typeof BulkUserResult>;
