import { z, stringToBool } from '~common/lib/zod';

import { BulkMembership, BulkMembershipResult } from '~/models/memberships/types';

/**
 * Validation for a user
 */
export const User = z.object({
  username: z.string().min(1).readonly()
    .describe('Username'),

  token: z.string().min(1).readonly()
    .describe('Token used to authenticate user, generated when user is created'),

  isAdmin: z.boolean().default(false).optional()
    .describe('If user is an admin'),

  createdAt: z.date().readonly()
    .describe('Creation date'),

  updatedAt: z.date().nullable().readonly()
    .describe('Last update date'),
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
  query: z.string().optional()
    .describe('Query used for searching'),

  isAdmin: stringToBool.optional()
    .describe('If user is an admin'),
});

/**
 * Type for filters
 */
export type UserQueryFiltersType = z.infer<typeof UserQueryFilters>;

/**
 * Validation for setting multiple users
 */
export const BulkUser = z.object({
  username: z.string().min(1).readonly()
    .describe('Username'),

  isAdmin: z.boolean().default(false).optional()
    .describe('If user is an admin'),

  memberships: z.array(
    BulkMembership.omit({ username: true }),
  ).optional()
    .describe('Namespaces of the user'),
});

/**
 * Type for setting multiple users
 */
export type BulkUserType = z.infer<typeof BulkUser>;

/**
 * Validation for result of setting multiple users
 */
export const BulkUserResult = z.object({
  users: z.object({
    deleted: z.number().min(0)
      .describe('Number of item deleted'),

    updated: z.number().min(0)
      .describe('Number of item updated'),

    created: z.number().min(0)
      .describe('Number of item created'),
  })
    .describe('Summary of operations on users'),
}).and(BulkMembershipResult.partial());

/**
 * Type for result of setting multiple users
 */
export type BulkUserResultType = z.infer<typeof BulkUserResult>;
