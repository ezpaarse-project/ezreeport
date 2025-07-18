import { setupConfig } from '@ezreeport/config';
import { logLevels } from '@ezreeport/logger';

import type defaultConfig from '../../config/default.json';

export default setupConfig<typeof defaultConfig>({
  watch: {
    logger: {
      log: (message: string): boolean => process.stdout.write(`${message}\n`),
      levels: logLevels.values,
      meta: { scope: 'config', name: 'files' },
    },
  },
});
