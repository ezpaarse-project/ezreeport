import { Type, type Static } from '~/lib/typebox';
import { Filter } from './reports/fetch/filters';

export const Figure = Type.Object({
  type: Type.String(),

  data: Type.Optional(Type.Any()),

  filters: Type.Optional(
    Type.Array(Filter),
  ),

  params: Type.Record(Type.String(), Type.Any()),

  slots: Type.Optional(
    Type.Array(Type.Integer({ minimum: 0 })),
  ),
});

export type FigureType = Static<typeof Figure>;
