import { Type, type Static } from '~/lib/typebox';

export const PaginationQuery = Type.Partial(
  Type.Object({
    previous: Type.String(),
    count: Type.Number(),
  }),
);

export type PaginationQueryType = Static<typeof PaginationQuery>;
