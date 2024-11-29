import { z } from '~/lib/zod';

import { BulkMembership, BulkMembershipResult } from '~/models/memberships/types';

/**
 * Validation for a namespace
 */
export const Namespace = z.object({
  id: z.string().min(1).readonly()
    .describe('Namespace ID'),

  name: z.string().min(1)
    .describe('Namespace name'),

  fetchLogin: z.object({
    elastic: z.object({
      username: z.string().min(1)
        .describe('Elastic username used to fetch data for reports in this namespace'),
    }),
  }).describe('Credentials for fetchers used for namespace'),

  fetchOptions: z.object({
    elastic: z.object({}),
  }).describe('Additional options for fetchers used for namespace'),

  logoId: z.string().nullish()
    .describe('Namespace logo'),

  createdAt: z.date().readonly()
    .describe('Creation date'),

  updatedAt: z.date().nullable().readonly()
    .describe('Last update date'),
});

/**
 * Type for a namespace
 */
export type NamespaceType = z.infer<typeof Namespace>;

/**
 * Validation for creating/updating a namespace
 */
export const InputNamespace = Namespace.omit({
  // Stripping readonly properties
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for creating/updating a namespace
 */
export type InputNamespaceType = z.infer<typeof InputNamespace>;

/**
 * Validation for query filters of a namespace
 */
export const NamespaceQueryFilters = z.object({
  query: z.string().optional()
    .describe('Query used for searching'),
});

/**
 * Type for query filters of a namespace
 */
export type NamespaceQueryFiltersType = z.infer<typeof NamespaceQueryFilters>;

/**
 * Validation for setting multiple namespaces
 */
export const BulkNamespace = z.object({
  id: z.string().min(1).readonly()
    .describe('Namespace ID'),

  name: z.string().min(1)
    .describe('Namespace name'),

  fetchLogin: z.object({
    elastic: z.object({
      username: z.string().min(1)
        .describe('Elastic username used to fetch data for reports in this namespace'),
    }),
  }).describe('Credentials for fetchers used for namespace'),

  fetchOptions: z.object({
    elastic: z.object({}),
  }).describe('Additional options for fetchers used for namespace'),

  logoId: z.string().nullish()
    .describe('Namespace description'),

  memberships: z.array(
    BulkMembership.omit({ namespaceId: true }),
  ).optional()
    .describe('Members of the namespace'),
});

/**
 * Type for setting multiple namespaces
 */
export type BulkNamespaceType = z.infer<typeof BulkNamespace>;

/**
 * Validation for result of setting multiple namespace
 */
export const BulkNamespaceResult = z.object({
  namespaces: z.object({
    deleted: z.number().min(0)
      .describe('Number of item deleted'),

    updated: z.number().min(0)
      .describe('Number of item updated'),

    created: z.number().min(0)
      .describe('Number of item created'),
  })
    .describe('Summary of operations on namespace'),
}).and(BulkMembershipResult.partial());

/**
 * Type for result of setting multiple namespace
 */
export type BulkNamespaceResultType = z.infer<typeof BulkNamespaceResult>;
