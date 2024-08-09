/* eslint-disable import/prefer-default-export */
import type { TSchema } from '@sinclair/typebox';
import { Type, type Static } from '~/lib/typebox';

type PaginationSortKey<Model extends Record<string, unknown>> = (Exclude<keyof Model, symbol>);

type PaginationOptions<
  Model extends Record<string, unknown>,
  PreviousType extends TSchema,
  PrimaryKey extends keyof Model,
  SortKey extends PaginationSortKey<Model>,
> = {
  model: Model;
  previousType: PreviousType,
  primaryKey: PrimaryKey,
  sortKeys: SortKey[],
};

type PaginationFindArgs<
  Model extends Record<string, unknown>,
  PreviousType extends TSchema,
  PrimaryKey extends keyof Model,
  SortKey extends PaginationSortKey<Model>,
> = {
  take?: number;
  skip?: number;
  cursor?: {
    [key in PrimaryKey]: Static<PreviousType>;
  };
  orderBy?: {
    [key in SortKey]?: 'asc' | 'desc';
  };
};

/**
 * Generates a pagination object with query and builder functions.
 *
 * @param opts The pagination options.
 *
 * @return The pagination object with query and builder functions.
 */
export const buildPagination = <
  Model extends Record<string, unknown>,
  PreviousType extends TSchema,
  PrimaryKey extends keyof Model,
  SortKey extends PaginationSortKey<Model>,
>(
    opts: PaginationOptions<Model, PreviousType, PrimaryKey, SortKey>,
  ) => {
  const PaginationQuery = Type.Partial(
    Type.Object({
      previous: opts.previousType,
      count: Type.Number(),
      sort: Type.Union(
        opts.sortKeys.map((key) => Type.Literal(key)),
      ),
    }),
  );

  type SimplePaginationQuery = {
    previous?: unknown;
    count?: number;
    sort?: string;
  };

  return {
    PaginationQuery,

    /**
     * Builds the Prisma args object for pagination.
     *
     * @param props The pagination properties.
     *
     * @return The Prisma args object.
     */
    buildPrismaArgs: (pagination: SimplePaginationQuery) => {
      const options: PaginationFindArgs<Model, PreviousType, PrimaryKey, SortKey> = {
        take: pagination.count || undefined,
      };

      if (pagination.previous) {
        options.skip = 1;
        options.cursor = {
          [opts.primaryKey]: pagination.previous,
        } as { [key in PrimaryKey]: Static<PreviousType> };
      }

      if (pagination.sort) {
        options.orderBy = {
          [pagination.sort]: 'asc',
        } as { [key in SortKey]: 'asc' | 'desc' };
      }

      return options;
    },
  };
};
