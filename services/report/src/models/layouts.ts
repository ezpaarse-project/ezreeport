import { Static, Type } from '~/lib/typebox';

import { Figure } from './figures';

export const Layout = Type.Object({
  figures: Type.Array(Figure, { minItems: 1 }),
});

export type LayoutType = Static<typeof Layout>;
