import { Access } from '@ezreeport/database/types';
import { z } from '@ezreeport/models/lib/zod';

/**
 * Validation for membership
 */
export const Membership = z.object({
  access: z.enum(Access).describe('Permissions of user on namespace'),

  createdAt: z.date().describe('Creation date'),

  namespaceId: z.string().min(1).describe('Namespace ID'),

  updatedAt: z.date().nullable().describe('Last update date'),

  username: z.string().min(1).describe('Username'),
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
export const BulkMembership = z
  .object({
    access: z.enum(Access).describe('Permissions of user on namespace'),

    namespaceId: z.string().min(1).describe('Namespace ID'),

    username: z.string().min(1).describe('Username'),
  })
  .strict();

/**
 * Type for setting multiple memberships
 */
export type BulkMembershipType = z.infer<typeof BulkMembership>;

/**
 * Validation for result of setting multiple memberships
 */
export const BulkMembershipResult = z.object({
  memberships: z
    .object({
      created: z.int().min(0).describe('Number of item created'),

      deleted: z.int().min(0).describe('Number of item deleted'),

      updated: z.int().min(0).describe('Number of item updated'),
    })
    .describe('Summary of operations on memberships'),
});

/**
 * Type for result of setting multiple memberships
 */
export type BulkMembershipResultType = z.infer<typeof BulkMembershipResult>;
