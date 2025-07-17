import { setupConfig } from '@ezreeport/config';

import type defaultConfig from '../../config/default.json';

export default setupConfig<typeof defaultConfig>({
  watch: {
    logger: console,
  },
});
