import { z } from '~/lib/zod';

import { SuccessResponseWithMeta } from '~/routes/v2/responses';

/**
 * Validation for pagination
 */
export const PaginationQuery = z.object({
  count: z.coerce.number().min(0).default(15)
    .describe('Count of items wanted'),

  page: z.coerce.number().min(1).default(1)
    .describe('Page number'),

  sort: z.string().optional()
    .describe('Sort field'),

  order: z.enum(['asc', 'desc']).default('asc')
    .describe('Sort order'),
});

/**
 * Type for pagination
 */
export type PaginationType = z.infer<typeof PaginationQuery>;

export const PaginationResponse = <
  T extends z.ZodSchema,
  M extends z.ZodSchema,
>(content: T, customMeta?: M) => SuccessResponseWithMeta(
    z.array(content).min(0),

    z.object({
      total: z.number().min(0)
        .describe('Total number of items'),

      page: z.number().min(1)
        .describe('Page number'),

      count: z.number().min(0)
        .describe('Count of items returned'),
    }).and(customMeta || z.object({})),
  );
