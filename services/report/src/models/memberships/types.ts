import { z } from '~/lib/zod';
import { Access } from '~/lib/prisma';

/**
 * Validation for membership
 */
export const Membership = z.object({
  username: z.string().min(1)
    .describe('Username'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID'),

  access: z.nativeEnum(Access)
    .describe('Permissions of user on namespace'),

  createdAt: z.date().readonly()
    .describe('Creation date'),

  updatedAt: z.date().nullable().readonly()
    .describe('Last update date'),
});

/**
 * Type for membership
 */
export type MembershipType = z.infer<typeof Membership>;

/**
 * Validation for creating/updating membership
 */
export const InputMembership = Membership.omit({
  // Stripping readonly properties
  username: true,
  namespaceId: true,
  createdAt: true,
  updatedAt: true,
}).strict();

/**
 * Type for creating/updating membership
 */
export type InputMembershipType = z.infer<typeof InputMembership>;

/**
 * Validation for setting multiple memberships
 */
export const BulkMembership = z.object({
  username: z.string().min(1)
    .describe('Username'),

  namespaceId: z.string().min(1)
    .describe('Namespace ID'),

  access: z.nativeEnum(Access)
    .describe('Permissions of user on namespace'),
}).strict();

/**
 * Type for setting multiple memberships
 */
export type BulkMembershipType = z.infer<typeof BulkMembership>;

/**
 * Validation for result of setting multiple memberships
 */
export const BulkMembershipResult = z.object({
  memberships: z.object({
    deleted: z.number().min(0)
      .describe('Number of item deleted'),

    updated: z.number().min(0)
      .describe('Number of item updated'),

    created: z.number().min(0)
      .describe('Number of item created'),
  })
    .describe('Summary of operations on memberships'),
});

/**
 * Type for result of setting multiple memberships
 */
export type BulkMembershipResultType = z.infer<typeof BulkMembershipResult>;
