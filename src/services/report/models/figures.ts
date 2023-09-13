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
});

export type FigureType = Static<typeof Figure>;
