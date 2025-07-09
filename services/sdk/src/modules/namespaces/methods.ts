import { transformCreatedUpdated } from '~/lib/transform';

import type { Namespace, RawNamespace } from './types';

export const transformNamespace = (n: RawNamespace): Namespace => ({
  ...transformCreatedUpdated(n),
});
