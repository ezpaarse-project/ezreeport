import { z } from '../lib/zod';

/**
 * Validation for a namespace
 */
export const Namespace = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  fetchLogin: z
    .object({
      elastic: z.object({
        username: z
          .string()
          .min(1)
          .describe(
            'Elastic username used to fetch data for reports in this namespace'
          ),
      }),
    })
    .describe('Credentials for fetchers used for namespace'),

  fetchOptions: z
    .object({
      elastic: z.object({}),
    })
    .describe('Additional options for fetchers used for namespace'),

  id: z.string().min(1).describe('Namespace ID'),

  logoId: z.string().nullish().describe('Namespace logo'),

  name: z.string().min(1).describe('Namespace name'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a namespace
 */
export type NamespaceType = z.infer<typeof Namespace>;
