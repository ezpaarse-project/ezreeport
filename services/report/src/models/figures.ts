import { Type, type Static } from '~/lib/typebox';

export const Figure = Type.Object({
  type: Type.String(),

  data: Type.Optional(
    Type.Any(),
  ),

  params: Type.Record(Type.String(), Type.Any()),

  slots: Type.Optional(
    Type.Array(
      Type.Integer({ minimum: 0 }),
    ),
  ),

  fetchOptions: Type.Optional(
    Type.Intersect([
      Type.Union([
        Type.Object({
          buckets: Type.Optional(
            Type.Array(
              Type.Record(Type.String(), Type.Any()),
            ),
          ),

          metric: Type.Optional(
            Type.Record(Type.String(), Type.Any()),
          ),
        }),
        // OR
        Type.Object({
          aggs: Type.Optional(
            Type.Array(
              Type.Record(Type.String(), Type.Any()),
            ),
          ),
        }),
      ]),
      // AND
      Type.Object({
        fetchCount: Type.Optional(
          Type.String({ minLength: 1 }),
        ),

        filters: Type.Optional(
          Type.Record(Type.String(), Type.Any()),
        ),
      }),
    ]),
  ),
});

export type FigureType = Static<typeof Figure>;
