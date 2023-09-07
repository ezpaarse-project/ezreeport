import { Static, Type } from '~/lib/typebox';

import { Figure } from './figures';

export const Layout = Type.Object({
  data: Type.Optional(
    Type.Any(),
  ),

  fetcher: Type.Optional(
    Type.Literal('elastic'),
  ),

  figures: Type.Array(Figure, { minItems: 1 }),

  fetchOptions: Type.Optional(
    Type.Object({
      aggs: Type.Optional(
        Type.Array(
          Type.Record(Type.String(), Type.Any()),
        ),
      ),

      fetchCount: Type.Optional(
        Type.String({ minLength: 1 }),
      ),

      filters: Type.Optional(
        Type.Record(Type.String(), Type.Any()),
      ),
    }),
  ),
});

export type LayoutType = Static<typeof Layout>;
