import { transformCreatedUpdated } from '~/lib/transform';

import type { Namespace, RawNamespace } from './types';

// eslint-disable-next-line import/prefer-default-export
export const transformNamespace = (n: RawNamespace): Namespace => ({
  ...transformCreatedUpdated(n),
});
