import { transformCreatedUpdated } from '~/lib/transform';

import type { Namespace, RawNamespace } from './types';

export const transformNamespace = (namespace: RawNamespace): Namespace => ({
  ...transformCreatedUpdated(namespace),
});
